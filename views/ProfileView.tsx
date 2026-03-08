
import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, Check, Camera, Upload, MapPin, Mail, Phone, Award, 
  Briefcase, Calendar, Star, ShieldCheck, FileText, Plus, 
  Edit2, Sparkles, Brain, GraduationCap, X, ChevronRight, Zap,
  // Added missing icons to fix errors on lines 195, 524, 545, 587, 605
  Globe, Settings, ShieldAlert, Shield, RefreshCw
} from 'lucide-react';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

const ProfileView: React.FC = () => {
  // Mock Initial State - would normally come from AuthContext or API
  const [profile, setProfile] = useState({
    fullName: 'John Anderson',
    email: 'john@buildcorp.com',
    phone: '+44 7700 900001',
    role: 'Principal Admin',
    location: 'London, United Kingdom',
    bio: 'Senior Construction Manager with over 20 years of experience in commercial and infrastructure projects. Passionate about safety leadership and digital transformation in construction.',
    avatar: null as string | null,
    skills: ['Strategic Planning', 'Budget Management', 'Stakeholder Relations', 'Contract Negotiation', 'Risk Assessment'],
    certifications: [
        { id: 1, name: 'PMP - Project Management Professional', issuer: 'PMI', date: '2020-05-15', expiry: '2026-05-15', status: 'Valid' },
        { id: 2, name: 'PRINCE2 Practitioner', issuer: 'Axelos', date: '2022-01-10', expiry: '2025-01-10', status: 'Expiring' },
        { id: 3, name: 'NEBOSH Construction Certificate', issuer: 'NEBOSH', date: '2019-08-22', expiry: '2024-08-22', status: 'Expired' }
    ]
  });

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUALIFICATIONS' | 'SETTINGS'>('OVERVIEW');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for inputs
  const [showCertModal, setShowCertModal] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', expiry: '' });
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);

  // AI Recommendation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);

  // AI Skill Suggestions State
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Debounce for skill suggestions
  useEffect(() => {
    if (!newSkill.trim() || newSkill.length < 2) {
      setSkillSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSkillSuggestions(newSkill);
    }, 600);

    return () => clearTimeout(timer);
  }, [newSkill]);

  const fetchSkillSuggestions = async (query: string) => {
    setIsFetchingSuggestions(true);
    try {
      const prompt = `
        Act as a Construction Industry Talent Acquisition & Workforce Strategist.
        The user is currently typing a skill in their profile: "${query}".
        User Role: "${profile.role}".
        
        Task: Suggest 5 highly relevant construction-specific skills, tools, or certifications that start with or are technically related to "${query}".
        Context: Prioritize modern site tech (BIM, Digital Twins, Procore, LiDAR), safety protocols (NEBOSH, OSHA), or management methodologies (Lean, Agile, Prince2).
        
        Return ONLY a raw JSON array of strings: ["Suggestion 1", "Suggestion 2", ...]
      `;
      
      const result = await runRawPrompt(prompt, { 
        model: 'gemini-3-flash-preview',
        responseMimeType: 'application/json',
        temperature: 0.3
      });
      
      const data = parseAIJSON(result);
      if (Array.isArray(data)) {
        // Filter out duplicates and existing skills
        const filtered = data.filter(s => !profile.skills.some(existing => existing.toLowerCase() === s.toLowerCase()));
        setSkillSuggestions(filtered);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions", e);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsSaving(false);
      setSuccessMessage('Profile Updated');
      setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddCert = () => {
    if (!newCert.name || !newCert.issuer) return;
    const cert = {
        id: Date.now(),
        ...newCert,
        date: new Date().toISOString().split('T')[0],
        status: 'Valid' as const
    };
    setProfile(prev => ({
        ...prev,
        certifications: [cert, ...prev.certifications]
    }));
    setNewCert({ name: '', issuer: '', expiry: '' });
    setShowCertModal(false);
  };

  const handleAddSkill = (skillToAdd: string) => {
    const cleanSkill = skillToAdd.trim();
    if (!cleanSkill || profile.skills.some(s => s.toLowerCase() === cleanSkill.toLowerCase())) return;
    setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, cleanSkill]
    }));
    setNewSkill('');
    setSkillSuggestions([]);
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const getAIRecommendations = async () => {
    setIsAnalyzing(true);
    setRecommendations(null);
    try {
        const prompt = `
            Analyze this professional profile for a construction industry user:
            Role: ${profile.role}
            Skills: ${profile.skills.join(', ')}
            Certifications: ${profile.certifications.map(c => c.name).join(', ')}
            
            Provide 3 specific training or certification recommendations that would help this user advance their career or bridge modern technology gaps in construction (e.g., BIM, AI, Sustainability).
            
            Return JSON only in this format:
            [
              { "title": "Course/Cert Name", "reason": "Why it helps", "difficulty": "Beginner|Intermediate|Advanced" }
            ]
        `;
        
        const result = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json',
            temperature: 0.5 
        });
        
        const data = parseAIJSON(result);
        setRecommendations(data);
    } catch (e) {
        console.error("Analysis failed", e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      {/* Header Profile Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mb-8 relative">
          <div className="h-40 bg-gradient-to-r from-[#0f5c82] to-[#1e3a8a] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Globe size={120} className="text-white" />
              </div>
          </div>
          
          <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-6 gap-6">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                      <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden text-4xl font-bold text-[#0f5c82]">
                          {profile.avatar ? (
                              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                              getInitials(profile.fullName)
                          )}
                      </div>
                      <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <Camera className="text-white" size={24} />
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  
                  <div className="flex-1">
                      <h1 className="text-3xl font-bold text-zinc-900 mb-1">{profile.fullName}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-zinc-500 text-sm font-medium">
                          <span className="text-[#0f5c82] font-black uppercase tracking-widest text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{profile.role}</span>
                          <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                          <span className="flex items-center gap-1"><Calendar size={14} /> Joined Jan 2018</span>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      {successMessage && <span className="flex items-center gap-1 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-right-2"><Check size={16} /> {successMessage}</span>}
                      <button className="px-4 py-2 bg-white border border-zinc-300 rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 shadow-sm transition-all active:scale-95">
                          Public View
                      </button>
                      <button onClick={handleSave} className="px-6 py-2 bg-[#0f5c82] text-white rounded-lg font-bold hover:bg-[#0c4a6e] shadow-lg flex items-center gap-2 transition-all active:scale-95">
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                          Save Changes
                      </button>
                  </div>
              </div>

              <div className="flex border-b border-zinc-200">
                  <button 
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`px-6 py-3 font-bold text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'OVERVIEW' ? 'border-[#0f5c82] text-[#0f5c82]' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                  >
                      Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab('QUALIFICATIONS')}
                    className={`px-6 py-3 font-bold text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'QUALIFICATIONS' ? 'border-[#0f5c82] text-[#0f5c82]' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                  >
                      Qualifications & Skills
                  </button>
                  <button 
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`px-6 py-3 font-bold text-[10px] uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'SETTINGS' ? 'border-[#0f5c82] text-[#0f5c82]' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                  >
                      Account Settings
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
              
              {activeTab === 'OVERVIEW' && (
                  <>
                      {/* Bio Section */}
                      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm group">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                  <FileText size={18} className="text-[#0f5c82]" /> Professional Summary
                              </h3>
                              <button className="text-zinc-300 hover:text-[#0f5c82] transition-colors"><Edit2 size={16} /></button>
                          </div>
                          <p className="text-zinc-600 leading-relaxed font-medium italic">
                              "{profile.bio}"
                          </p>
                      </div>

                      {/* Current Stats */}
                      <div className="grid grid-cols-3 gap-6">
                          <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm text-center hover:border-primary hover:shadow-xl transition-all cursor-default group">
                              <div className="text-4xl font-black text-primary tracking-tighter mb-1 group-hover:scale-110 transition-transform">42</div>
                              <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Projects Cleared</div>
                          </div>
                          <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm text-center hover:border-green-500 hover:shadow-xl transition-all cursor-default group">
                              <div className="text-4xl font-black text-green-600 tracking-tighter mb-1 group-hover:scale-110 transition-transform">98%</div>
                              <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Safety Integrity</div>
                          </div>
                          <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm text-center hover:border-amber-500 hover:shadow-xl transition-all cursor-default group">
                              <div className="text-4xl font-black text-amber-500 tracking-tighter mb-1 group-hover:scale-110 transition-transform">4.9</div>
                              <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Expertise Rating</div>
                          </div>
                      </div>

                      {/* Activity Feed Mockup */}
                      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
                          <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest mb-8">Recent Forensic Trail</h3>
                          <div className="space-y-8 relative">
                              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-100" />
                              <div className="flex gap-6 relative">
                                  <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm shrink-0 z-10"></div>
                                  <div>
                                      <p className="text-sm text-zinc-800 font-black uppercase tracking-tight">Approved Budget Node for <span className="text-primary">City Plaza Phase 2</span></p>
                                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">2 hours ago • Financial Shard</p>
                                  </div>
                              </div>
                              <div className="flex gap-6 relative">
                                  <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-sm shrink-0 z-10"></div>
                                  <div>
                                      <p className="text-sm text-zinc-800 font-black uppercase tracking-tight">Uploaded 3 new compliance artifacts</p>
                                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Yesterday • Asset Registry</p>
                                  </div>
                              </div>
                              <div className="flex gap-6 relative">
                                  <div className="w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-sm shrink-0 z-10"></div>
                                  <div>
                                      <p className="text-sm text-zinc-800 font-black uppercase tracking-tight">Flagged safety deviation at <span className="text-primary">Westside Heights</span></p>
                                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">3 days ago • Vision Guard</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </>
              )}

              {activeTab === 'QUALIFICATIONS' && (
                  <>
                      {/* AI Recommendations Banner */}
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600 transition-transform group-hover:scale-110">
                              <Brain size={120} />
                          </div>
                          
                          <div className="relative z-10">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="font-black text-indigo-900 uppercase tracking-widest text-sm flex items-center gap-2">
                                      <Sparkles size={20} className="text-indigo-500 animate-pulse" /> AI Skill Extraction
                                  </h3>
                                  <button 
                                    onClick={getAIRecommendations}
                                    disabled={isAnalyzing}
                                    className="bg-white text-indigo-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                  >
                                      {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={16} />}
                                      {isAnalyzing ? 'Auditing Nodes...' : 'Run Skills Diagnostic'}
                                  </button>
                              </div>
                              
                              {recommendations ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                      {recommendations.map((rec, idx) => (
                                          <div key={idx} className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-indigo-50 shadow-sm flex flex-col justify-between group/rec hover:shadow-xl hover:-translate-y-1 transition-all">
                                              <div>
                                                  <div className="flex justify-between items-start mb-3">
                                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                          rec.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                                          rec.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                                                          'bg-purple-100 text-purple-700'
                                                      }`}>
                                                          {rec.difficulty} Shard
                                                      </span>
                                                  </div>
                                                  <div className="font-black text-xs text-zinc-900 mb-2 uppercase tracking-tight group-hover/rec:text-indigo-600 transition-colors">{rec.title}</div>
                                                  <p className="text-[11px] text-zinc-600 leading-relaxed mb-4 italic">"{rec.reason}"</p>
                                              </div>
                                              <button className="text-[9px] font-black text-indigo-600 flex items-center gap-1 hover:underline uppercase tracking-widest">
                                                  Locate Provider <ChevronRight size={12} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-xs text-zinc-500 font-medium italic">
                                      {isAnalyzing ? "Gemini is reconciling current competencies with global industry benchmarks..." : "Launch a diagnostic scan to identify optimal training paths based on your role and existing shard dataset."}
                                  </p>
                              )}
                          </div>
                      </div>

                      {/* Skills Section with AI Auto-Suggestions */}
                      <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative group/skills">
                          <div className="flex justify-between items-center mb-8">
                              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                  <Star className="text-yellow-500" size={20} /> Expertise Shards
                              </h3>
                              {!showSkillInput && (
                                <button 
                                    onClick={() => setShowSkillInput(true)} 
                                    className="p-3 bg-zinc-50 text-zinc-400 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                                >
                                    <Plus size={20} />
                                </button>
                              )}
                          </div>
                          
                          {showSkillInput && (
                              <div className="mb-10 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                  <form 
                                    onSubmit={(e) => { e.preventDefault(); handleAddSkill(newSkill); }} 
                                    className="flex gap-3"
                                  >
                                      <div className="relative flex-1 group">
                                          <input 
                                            type="text" 
                                            autoFocus
                                            className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold uppercase tracking-tight outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                                            placeholder="Input skill node (e.g. BIM Coord, Site Safety...)"
                                            value={newSkill}
                                            onChange={e => setNewSkill(e.target.value)}
                                          />
                                          {isFetchingSuggestions && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                              <Loader2 size={18} className="animate-spin text-primary" />
                                            </div>
                                          )}
                                      </div>
                                      <button 
                                        type="submit" 
                                        className="bg-midnight text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-primary active:scale-95 transition-all"
                                      >
                                          Commit
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => { setShowSkillInput(false); setNewSkill(''); setSkillSuggestions([]); }} 
                                        className="p-4 text-zinc-400 hover:bg-zinc-100 rounded-2xl transition-colors"
                                      >
                                          <X size={24} />
                                      </button>
                                  </form>

                                  {/* Refined AI Suggestions HUD */}
                                  {(skillSuggestions.length > 0 || isFetchingSuggestions) && (
                                    <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden ring-1 ring-white/5">
                                      <div className="absolute top-0 right-0 p-4 opacity-10">
                                          <Zap size={64} className="text-yellow-400 fill-current" />
                                      </div>
                                      <div className="relative z-10">
                                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <Sparkles size={12} className="text-yellow-400" /> AI-Inferred Proficiencies
                                          </div>
                                          <div className="flex flex-wrap gap-2.5">
                                            {skillSuggestions.map((suggestion, idx) => (
                                              <button 
                                                key={idx}
                                                onClick={() => handleAddSkill(suggestion)}
                                                className="px-4 py-2 bg-white/5 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-2 group/sug active:scale-95 shadow-sm"
                                              >
                                                <Plus size={10} className="group-hover/sug:rotate-90 transition-transform" /> {suggestion}
                                              </button>
                                            ))}
                                            {isFetchingSuggestions && (
                                              <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic animate-pulse">
                                                <Loader2 size={12} className="animate-spin" /> Retrieving context...
                                              </div>
                                            )}
                                          </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                          )}

                          <div className="flex flex-wrap gap-3 mb-4">
                              {profile.skills.map(skill => (
                                  <div key={skill} className="px-6 py-3 bg-zinc-50 text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 flex items-center gap-3 group/skill transition-all hover:border-primary hover:bg-white hover:shadow-lg">
                                      {skill}
                                      <button onClick={() => removeSkill(skill)} className="opacity-0 group-hover/skill:opacity-100 hover:text-red-500 transition-all active:scale-75">
                                          <X size={14} strokeWidth={3} />
                                      </button>
                                  </div>
                              ))}
                              {!showSkillInput && (
                                  <button onClick={() => setShowSkillInput(true)} className="px-6 py-3 border-2 border-dashed border-zinc-200 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary hover:bg-blue-50/50 transition-all flex items-center gap-2 group">
                                      <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Append Node
                                  </button>
                              )}
                          </div>
                      </div>

                      {/* Certifications */}
                      <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm">
                          <div className="flex justify-between items-center mb-8">
                              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                  <Award size={20} className="text-orange-500" /> Compliance Registry
                              </h3>
                              <button 
                                onClick={() => setShowCertModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-primary transition-all active:scale-95"
                              >
                                  <Plus size={16} /> New Artifact
                              </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {profile.certifications.map(cert => (
                                  <div key={cert.id} className="border border-zinc-100 bg-zinc-50/50 rounded-3xl p-6 flex items-center justify-between hover:border-primary hover:bg-white transition-all group shadow-sm hover:shadow-xl">
                                      <div className="flex items-center gap-5">
                                          <div className="p-4 bg-white rounded-2xl text-zinc-400 group-hover:text-primary transition-all shadow-inner border border-zinc-100">
                                              <ShieldCheck size={28} />
                                          </div>
                                          <div className="min-w-0">
                                              <div className="font-black text-zinc-900 text-xs uppercase tracking-tight truncate max-w-[200px]">{cert.name}</div>
                                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{cert.issuer}</div>
                                          </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border shadow-sm ${
                                              cert.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                              cert.status === 'Expiring' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                              'bg-red-50 text-red-700 border-red-100'
                                          }`}>
                                              {cert.status}
                                          </span>
                                          <div className="text-[8px] text-zinc-400 font-black mt-2 uppercase tracking-tighter">EXP: {cert.expiry}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </>
              )}

              {activeTab === 'SETTINGS' && (
                  <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm animate-in slide-in-from-bottom-4">
                      <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest mb-10 flex items-center gap-2"><Settings size={20} className="text-zinc-400" /> Account Protocols</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Identifier Label</label>
                              <input type="text" value={profile.fullName} readOnly className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-500 uppercase cursor-not-allowed" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Functional Rank</label>
                              <input type="text" value={profile.role} readOnly className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-500 uppercase cursor-not-allowed" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Network Endpoint</label>
                              <input type="email" value={profile.email} readOnly className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-500 cursor-not-allowed" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Secure Link (Phone)</label>
                              <input type="text" value={profile.phone} readOnly className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-500 cursor-not-allowed" />
                          </div>
                      </div>
                      
                      <div className="border-t border-zinc-100 mt-12 pt-10">
                          <h4 className="font-black text-red-600 text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldAlert size={16} /> Restricted Procedures</h4>
                          <button className="px-8 py-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm">
                              Deauthorize Identity Node
                          </button>
                      </div>
                  </div>
              )}
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-8">
              {/* Contact Card */}
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary transition-all">
                  <h3 className="font-black text-zinc-900 text-xs uppercase tracking-widest mb-6">Communication Nodes</h3>
                  <div className="space-y-6">
                      <div className="flex items-center gap-5 group/item cursor-pointer">
                          <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-inner border border-zinc-100"><Mail size={18} /></div>
                          <div className="flex-1 overflow-hidden">
                              <div className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-0.5">Endpoint</div>
                              <div className="font-bold text-zinc-800 truncate text-sm">{profile.email}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-5 group/item cursor-pointer">
                          <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-inner border border-zinc-100"><Phone size={18} /></div>
                          <div className="flex-1">
                              <div className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-0.5">Secure Dial</div>
                              <div className="font-bold text-zinc-800 text-sm">{profile.phone}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-5 group/item cursor-pointer">
                          <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-inner border border-zinc-100"><MapPin size={18} /></div>
                          <div className="flex-1">
                              <div className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-0.5">Assigned Hub</div>
                              <div className="font-bold text-zinc-800 text-sm">EMEA Cluster • London</div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Documentation Status */}
              <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                      <Shield size={100} className="text-primary" />
                  </div>
                  <h3 className="font-black text-primary text-[10px] font-black uppercase tracking-[0.3em] relative z-10">Identity Guard</h3>
                  <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                          <span className="text-zinc-400 text-xs font-bold uppercase tracking-tight">Logic Rights</span>
                          <span className="text-emerald-400 font-black text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">VERIFIED</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                          <span className="text-zinc-400 text-xs font-bold uppercase tracking-tight">Ledger Access</span>
                          <span className="text-emerald-400 font-black text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">VERIFIED</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                          <span className="text-zinc-400 text-xs font-bold uppercase tracking-tight">Forensic Node</span>
                          <span className="text-orange-400 font-black text-[9px] bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">PENDING</span>
                      </div>
                  </div>
                  <button className="w-full py-4 bg-white text-zinc-950 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-primary hover:text-white transition-all active:scale-95 relative z-10 flex items-center justify-center gap-2 group/sync">
                      <RefreshCw size={14} className="group-hover/sync:rotate-180 transition-transform" /> Re-Sync Identity
                  </button>
              </div>
          </div>
      </div>

      {/* Certification Modal */}
      {showCertModal && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300 border border-zinc-200 flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Award size={24} /></div>
                          <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Append Artifact</h3>
                      </div>
                      <button onClick={() => setShowCertModal(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"><X size={24} /></button>
                  </div>
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Registry Label</label>
                          <input 
                            type="text" 
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold uppercase focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" 
                            value={newCert.name}
                            onChange={e => setNewCert({...newCert, name: e.target.value})}
                            placeholder="e.g. CSCS Gold Node"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Issuing Authority</label>
                          <input 
                            type="text" 
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold uppercase focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" 
                            value={newCert.issuer}
                            onChange={e => setNewCert({...newCert, issuer: e.target.value})}
                            placeholder="e.g. CITB / OSHA"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Temporal Expiry</label>
                          <input 
                            type="date" 
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none shadow-inner" 
                            value={newCert.expiry}
                            onChange={e => setNewCert({...newCert, expiry: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                      <button onClick={() => setShowCertModal(false)} className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">Cancel</button>
                      <button 
                        onClick={handleAddCert}
                        disabled={!newCert.name || !newCert.issuer}
                        className="flex-[2] py-4 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-primary active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                      >
                          Commit to Registry
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfileView;
