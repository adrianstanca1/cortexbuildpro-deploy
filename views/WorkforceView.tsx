
import React, { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { AlertTriangle, Award, Calendar, CheckCircle2, Briefcase, Loader2, Sparkles, RefreshCw, Brain, BookOpen, GraduationCap } from 'lucide-react';
import { runRawPrompt } from '../services/geminiService';

const WorkforceView: React.FC = () => {
  const { teamMembers, isLoading } = useProjects();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Training Recommendation State
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<any[] | null>(null);

  // --- Derived Stats ---
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'On Site').length;
  const utilizationRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
  
  // Skill Gaps (Mock logic for simulation)
  const allSkills = teamMembers.flatMap(m => m.skills || []);
  const uniqueSkills = Array.from(new Set(allSkills)) as string[];
  const skillCounts = uniqueSkills.reduce((acc, skill) => {
      acc[skill] = allSkills.filter(s => s === skill).length;
      return acc;
  }, {} as Record<string, number>);
  
  // Identify "Low Supply" skills (less than 2 people have it)
  const skillGaps = Object.entries(skillCounts).filter(([_, count]) => count < 2).map(([skill]) => skill);

  // Expiring Certifications
  const expiringCerts = teamMembers.flatMap(m => 
      (m.certifications || [])
        .filter(c => c.status === 'Expiring' || c.status === 'Expired')
        .map(c => ({ member: m.name, cert: c.name, date: c.expiryDate, status: c.status }))
  );

  const runWorkforceAnalysis = async () => {
      setAnalyzing(true);
      try {
          const context = {
              totalMembers,
              utilizationRate,
              skillCounts,
              gaps: skillGaps,
              expiring: expiringCerts.length
          };
          
          const prompt = `
            As a senior construction workforce consultant, analyze this data: ${JSON.stringify(context)}.
            Provide a concise strategic summary (max 3 sentences) identifying key risks (e.g. reliance on specific skills) and a recruitment recommendation.
            Tone: Professional and actionable.
          `;
          
          const result = await runRawPrompt(prompt, {
              model: 'gemini-3-pro-preview', // Using Pro for reasoning
              temperature: 0.4,
              thinkingConfig: { thinkingBudget: 1024 }
          });
          
          setAiAnalysis(result);
      } catch (e) {
          console.error("Analysis failed", e);
      } finally {
          setAnalyzing(false);
      }
  };

  const generateTrainingPlan = async () => {
      if (skillGaps.length === 0) {
          alert("No critical skill gaps identified.");
          return;
      }
      setTrainingLoading(true);
      try {
          const prompt = `
            Based on these skill gaps in a construction team: ${skillGaps.join(', ')}.
            Recommend 3 specific training courses or certifications to address these gaps.
            Return JSON: [{ "course": "string", "provider": "string", "targetSkill": "string" }]
          `;
          const res = await runRawPrompt(prompt, { model: 'gemini-2.5-flash', responseMimeType: 'application/json' });
          setTrainingPlan(JSON.parse(res));
      } catch (e) {
          console.error("Training plan failed", e);
      } finally {
          setTrainingLoading(false);
      }
  };

  if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
       <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Workforce Analytics</h1>
            <p className="text-zinc-500">Real-time insights into team capacity, skills, and compliance.</p>
        </div>
        <button 
            onClick={runWorkforceAnalysis}
            disabled={analyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                analyzing 
                ? 'bg-purple-100 text-purple-400 cursor-not-allowed' 
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
            }`}
        >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            {analyzing ? 'Thinking...' : 'AI Analysis'}
        </button>
      </div>

      {aiAnalysis && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-600"><Sparkles size={64} /></div>
              <h3 className="text-sm font-bold text-purple-800 uppercase mb-2 flex items-center gap-2 relative z-10">
                  <Sparkles size={14} /> Gemini Workforce Consultant
              </h3>
              <p className="text-purple-900 text-base leading-relaxed relative z-10 font-medium">
                  {aiAnalysis}
              </p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className={`text-3xl font-bold mb-1 ${utilizationRate > 80 ? 'text-green-600' : 'text-zinc-900'}`}>{utilizationRate}%</div>
              <div className="text-xs text-zinc-500 uppercase font-bold">Current Utilization</div>
              <div className="text-xs text-zinc-400 mt-2">{activeMembers} of {totalMembers} active</div>
          </div>
           <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="text-zinc-900 text-3xl font-bold mb-1">{skillGaps.length}</div>
              <div className="text-xs text-zinc-500 uppercase font-bold">Skill Gaps Identified</div>
              <div className="text-xs text-red-500 mt-2 font-medium">Critical: {skillGaps.slice(0, 2).join(', ')}</div>
          </div>
           <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="text-zinc-900 text-3xl font-bold mb-1">{expiringCerts.length}</div>
              <div className="text-xs text-zinc-500 uppercase font-bold">Compliance Risks</div>
              <div className="text-xs text-orange-500 mt-2 font-medium">Expiring Certifications</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skill Matrix Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-zinc-800 flex items-center gap-2"><Award className="text-[#0f5c82]" size={20} /> Skill Matrix</h3>
                  {skillGaps.length > 0 && (
                      <button 
                        onClick={generateTrainingPlan}
                        disabled={trainingLoading}
                        className="text-xs font-bold text-[#0f5c82] bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm border border-blue-100"
                      >
                          {trainingLoading ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={14} />}
                          Suggest Training for Gaps
                      </button>
                  )}
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-4 custom-scrollbar">
                  {uniqueSkills.map(skill => {
                      const isGap = skillCounts[skill] < 2;
                      return (
                      <div key={skill} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-colors">
                          <span className="text-sm text-zinc-700 font-medium flex items-center gap-2">
                              {skill}
                              {isGap && <AlertTriangle size={14} className="text-red-500" title="Low supply" />}
                          </span>
                          <div className="flex items-center gap-3">
                              {isGap && <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 px-1.5 rounded">Risk</span>}
                              <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${isGap ? 'bg-red-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${Math.min(100, (skillCounts[skill] / totalMembers) * 100 * 3)}%` }} 
                                  />
                              </div>
                              <span className={`text-xs font-bold w-6 text-right ${isGap ? 'text-red-500' : 'text-zinc-700'}`}>{skillCounts[skill]}</span>
                          </div>
                      </div>
                  )})}
              </div>

              {/* Training Recommendations Result */}
              {trainingPlan && (
                  <div className="mt-auto pt-4 border-t border-zinc-100 animate-in slide-in-from-bottom-2">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                          <Sparkles size={12} className="text-blue-500" /> Recommended Training
                      </h4>
                      <div className="space-y-2">
                          {trainingPlan.map((tp, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs hover:bg-blue-50 transition-colors">
                                  <div>
                                      <div className="font-bold text-blue-900">{tp.course}</div>
                                      <div className="text-blue-600/80">{tp.provider}</div>
                                  </div>
                                  <span className="px-2 py-1 bg-white text-blue-700 border border-blue-200 rounded font-bold shadow-sm">{tp.targetSkill}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* Expiring Certs Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
              <h3 className="font-bold text-zinc-800 mb-6 flex items-center gap-2"><AlertTriangle className="text-orange-500" size={20} /> Expiring Qualifications</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {expiringCerts.length > 0 ? expiringCerts.map((item, i) => (
                      <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex items-start justify-between group hover:border-zinc-300 transition-colors">
                          <div>
                              <div className="font-bold text-zinc-900 text-sm mb-0.5">{item.member}</div>
                              <div className="text-xs text-zinc-500 font-medium">{item.cert}</div>
                          </div>
                          <div className="text-right">
                              <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded mb-1 inline-block ${item.status === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {item.status}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">{item.date}</div>
                          </div>
                      </div>
                  )) : (
                      <div className="text-center text-zinc-400 py-12 italic flex flex-col items-center">
                          <CheckCircle2 size={32} className="mb-2 opacity-20" />
                          All certifications are valid.
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Capacity Planning */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mt-8 shadow-sm">
           <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-zinc-800 flex items-center gap-2"><Calendar className="text-green-600" size={20} /> Project Allocation</h3>
               <button className="text-xs font-bold text-[#0f5c82] hover:underline">View Full Schedule</button>
           </div>
           <div className="space-y-4">
               {teamMembers.slice(0, 5).map(member => (
                   <div key={member.id} className="flex items-center gap-4">
                       <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white`}>
                           {member.initials}
                       </div>
                       <div className="w-32 text-sm font-medium text-zinc-900 truncate">{member.name}</div>
                       <div className="flex-1 h-8 bg-zinc-50 rounded-lg relative overflow-hidden border border-zinc-200 flex">
                           {/* Simulated Gantt Bar */}
                           <div className="w-[30%] bg-transparent border-r border-zinc-200/50"></div>
                           <div className="flex-1 bg-blue-100 border border-blue-200 rounded-sm m-1 flex items-center justify-center text-[10px] text-blue-800 font-medium truncate px-2 shadow-sm">
                               {member.projectName || 'Available'}
                           </div>
                           <div className="w-[20%] bg-transparent border-l border-zinc-200/50"></div>
                       </div>
                   </div>
               ))}
           </div>
      </div>
    </div>
  );
};

export default WorkforceView;
