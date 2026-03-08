import React, { useState } from 'react';
import { HardHat, Check, ArrowRight, Shield, User, Briefcase, Github, Mail, Loader2 } from 'lucide-react';
import { Page, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  setPage: (page: Page) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ setPage }) => {
  const { login, loginWithOAuth } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate a random state parameter for CSRF protection
  const generateState = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleDemoLogin = async (role: UserRole) => {
    login(role);
    setPage(Page.IMAGINE);
  };

  const handleGitHubLogin = async () => {
    setIsLoading('github');
    setError(null);
    try {
      // Generate and store state for CSRF protection
      const state = generateState();
      sessionStorage.setItem('oauth_state', state);

      // Open GitHub OAuth popup
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        throw new Error('GitHub OAuth not configured. Please set VITE_GITHUB_CLIENT_ID in environment.');
      }
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
      const scope = encodeURIComponent('user:email read:user');
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(state)}`;

      const popup = window.open(authUrl, 'github-oauth', 'width=600,height=800');

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        // Security: Validate origin to prevent cross-origin message attacks
        if (event.origin !== window.location.origin) {
          console.warn('Received message from unexpected origin:', event.origin);
          return;
        }

        if (event.data?.type === 'github_oauth_callback') {
          window.removeEventListener('message', handleMessage);

          // Security: Validate state parameter for CSRF protection
          const storedState = sessionStorage.getItem('oauth_state');
          if (!storedState || event.data.state !== storedState) {
            setError('Invalid OAuth state. Possible CSRF attack detected.');
            setIsLoading(null);
            sessionStorage.removeItem('oauth_state');
            return;
          }
          sessionStorage.removeItem('oauth_state');

          if (event.data.error) {
            setError(event.data.error);
            setIsLoading(null);
            return;
          }

          if (event.data.token) {
            // Exchange code for token via backend
            try {
              const response = await fetch('/api/auth/github/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: event.data.code }),
              });

              if (!response.ok) {
                throw new Error('Failed to authenticate with GitHub');
              }

              const data = await response.json();

              // Get user profile
              const userResponse = await fetch('/api/auth/github/user', {
                headers: { Authorization: `Bearer ${data.access_token}` },
              });

              if (!userResponse.ok) {
                throw new Error('Failed to fetch user profile');
              }

              const user = await userResponse.json();

              // Login with OAuth user
              loginWithOAuth({
                id: user.id?.toString() || user.login,
                name: user.name || user.login,
                email: user.email || `${user.login}@github.com`,
                avatarUrl: user.avatar_url,
                provider: 'github',
              });

              setPage(Page.IMAGINE);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Authentication failed');
            }
          }
          setIsLoading(null);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub login failed');
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    setError(null);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in environment.');
      }

      // Generate and store state for CSRF protection
      const state = generateState();
      sessionStorage.setItem('oauth_state', state);

      // Use Google Identity Services
      const { google } = window as any;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              // Send ID token to backend for verification
              try {
                const res = await fetch('/api/auth/google/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: response.credential, state }),
                });

                const data = await res.json();

                // Security: Validate state if returned by backend
                if (data.state && data.state !== sessionStorage.getItem('oauth_state')) {
                  setError('Invalid OAuth state. Possible CSRF attack detected.');
                  setIsLoading(null);
                  sessionStorage.removeItem('oauth_state');
                  return;
                }
                sessionStorage.removeItem('oauth_state');

                loginWithOAuth(data.user);
                setPage(Page.IMAGINE);
              } catch (err) {
                setError('Google authentication failed');
              }
            }
            setIsLoading(null);
          },
        });
        google.accounts.id.prompt();
      } else {
        throw new Error('Google Identity Services not loaded. Please refresh and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      setIsLoading(null);
    }
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

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGitHubLogin}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'github' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              <span>Continue with GitHub</span>
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-white text-zinc-700 font-medium border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-zinc-200"></div>
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">or use demo</span>
            <div className="flex-1 h-px bg-zinc-200"></div>
          </div>

          <div className="bg-white p-1 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-100/50 mb-8">
            <div className="bg-zinc-50/30 p-6 rounded-[20px]">
                <p className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-widest text-center lg:text-left">Select Demo Role</p>
                <div className="space-y-3">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleDemoLogin(account.role)}
                      disabled={isLoading !== null}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border bg-white transition-all shadow-sm hover:shadow-md group ${account.border} hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed`}
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