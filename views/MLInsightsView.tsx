
import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Zap, RefreshCw, Activity, Brain, CheckCircle2, XCircle, ArrowRight, Rocket } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { runRawPrompt } from '../services/geminiService';

const MLInsightsView: React.FC = () => {
  const { projects, tasks } = useProjects();
  const [isSimulating, setIsSimulating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [inferenceLog, setInferenceLog] = useState<string[]>([
      "Model initialized: Gemini 3 Pro",
      "Awaiting portfolio data input...",
  ]);

  const runSimulation = async () => {
    setIsSimulating(true);
    setInferenceLog(["Gathering project vectors..."]);
    
    try {
        // Prepare context
        const summary = projects.map(p => 
            `- ${p.name}: ${p.progress}% complete, Health: ${p.health}, Budget: £${p.budget}, Spent: £${p.spent}`
        ).join('\n');
        
        const overdueTasks = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length;
        
        setInferenceLog(prev => [...prev, "Sending telemetry to Gemini 3 Pro...", "Initializing Reasoning Engine...", "Thinking..."]);

        const prompt = `
            Analyze this construction portfolio:
            ${summary}
            Total Active Overdue Tasks across portfolio: ${overdueTasks}.

            Act as a senior risk analyst AI. Perform a comprehensive predictive analysis.
            Use deep reasoning to identify subtle risks and opportunities for optimization.
            
            Return a JSON object with the following structure (no markdown):
            {
                "optimizationScore": number (0-100),
                "riskProbability": number (0-100),
                "projectedSavings": number (estimated potential savings in GBP),
                "timelineDeviation": [number, number, number, number, number, number, number, number, number, number, number, number], // 12 months deviation
                "suggestions": [
                    { "title": "string", "desc": "string", "impact": "High" | "Medium" | "Low" }
                ]
            }
            
            Ensure realistic values based on the health statuses provided (At Risk projects should lower score/increase risk).
        `;

        const result = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json',
            temperature: 0.4,
            thinkingConfig: { thinkingBudget: 16384 } // Max thinking for complex analysis
        });

        const data = JSON.parse(result);
        setAnalysisResult(data);
        setInferenceLog(prev => [...prev, "Simulation Complete.", "Optimization vectors calculated."]);

    } catch (e) {
        console.error(e);
        setInferenceLog(prev => [...prev, "Error in simulation process."]);
    } finally {
        setIsSimulating(false);
    }
  };

  // Fallback initial state if analysis not run
  const score = analysisResult?.optimizationScore ?? 0;
  const risk = analysisResult?.riskProbability ?? 0;
  const savings = analysisResult?.projectedSavings ?? 0;
  const deviation = analysisResult?.timelineDeviation ?? [0,0,0,0,0,0,0,0,0,0,0,0];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-3">
                <Brain className="text-[#0f5c82]" /> Machine Learning Center
            </h1>
            <p className="text-zinc-500">Real-time predictive analytics powered by Gemini 3 Pro Reasoning.</p>
        </div>
        <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all ${
                isSimulating ? 'bg-zinc-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105'
            }`}
        >
            {isSimulating ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
            {isSimulating ? 'Thinking...' : 'Run Predictive Model'}
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white border border-zinc-200 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={64} /></div>
              <div className="relative z-10">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Efficiency Score</div>
                  <div className="flex items-end gap-3">
                      <div className={`text-4xl font-bold transition-all duration-1000 ${isSimulating ? 'blur-sm' : ''} ${score > 80 ? 'text-green-600' : 'text-zinc-900'}`}>
                          {analysisResult ? score : '--'}%
                      </div>
                      {score > 90 && <div className="text-green-600 text-sm font-bold mb-1.5">↑ Optimized</div>}
                  </div>
              </div>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle size={64} /></div>
              <div className="relative z-10">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Risk Probability</div>
                  <div className="flex items-end gap-3">
                      <div className={`text-4xl font-bold transition-all duration-1000 ${isSimulating ? 'blur-sm' : ''} ${risk < 30 ? 'text-green-600' : 'text-red-600'}`}>
                          {analysisResult ? risk : '--'}%
                      </div>
                      {analysisResult && (
                          <div className={`text-sm font-bold mb-1.5 ${risk < 30 ? 'text-green-600' : 'text-red-600'}`}>
                              {risk < 30 ? 'Low Risk' : 'Critical'}
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-300 font-mono text-xs flex flex-col h-36">
              <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-2">
                  <span className="font-bold text-zinc-100 flex items-center gap-2"><Activity size={14} /> Inference Log</span>
                  <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                  <div className="absolute inset-0 overflow-y-auto space-y-1.5 scrollbar-hide">
                      {inferenceLog.map((log, i) => (
                          <div key={i} className="truncate opacity-80 hover:opacity-100">
                              <span className="text-blue-500 mr-2">&gt;</span>{log}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-800 mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#0f5c82]" /> Projected Timeline Deviation
              </h3>
              <div className="h-80 w-full relative">
                   {/* Chart Area */}
                   <div className="absolute inset-0 flex items-end gap-1 pl-8 pb-6 border-l border-b border-zinc-200">
                       {/* Y Axis Labels */}
                       <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-zinc-400 py-2">
                           <span>+30d</span><span>+15d</span><span>0d</span><span>-15d</span>
                       </div>

                       {/* Bars */}
                       {deviation.map((val: number, i: number) => (
                           <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                               {/* Bar */}
                               <div className="w-full bg-zinc-100 h-full relative overflow-hidden rounded-t-sm">
                                   {/* Baseline */}
                                   <div className="absolute top-1/2 w-full border-t border-zinc-300 border-dashed"></div>
                                   
                                   {/* Value Bar */}
                                   <div 
                                        className={`absolute left-1 right-1 transition-all duration-1000 ease-out ${val > 0 ? 'bottom-1/2 bg-red-400' : 'top-1/2 bg-green-400'}`}
                                        style={{ 
                                            height: `${Math.abs(isSimulating ? Math.random() * 30 : val * 1.5)}%` 
                                        }}
                                   ></div>
                               </div>
                               
                               {/* Tooltip */}
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                   M{i+1}: {val > 0 ? `+${val}d delay` : `${val}d gain`}
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> Delay Risk</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> Time Savings</div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="font-bold text-zinc-800 mb-4">Optimization Plan</h3>
                  <div className="space-y-3 flex-1 overflow-y-auto h-64">
                      {analysisResult?.suggestions ? (
                          analysisResult.suggestions.map((rec: any, i: number) => (
                              <div key={i} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-blue-50 transition-colors">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-zinc-900 text-sm">{rec.title}</span>
                                      {rec.impact === 'High' && <ArrowRight size={14} className="text-red-500" />}
                                  </div>
                                  <p className="text-xs text-zinc-600">{rec.desc}</p>
                              </div>
                          ))
                      ) : (
                          <div className="text-center text-zinc-400 py-8 italic flex flex-col items-center">
                              <Rocket size={32} className="mb-2 opacity-20" />
                              Run model to generate suggestions.
                          </div>
                      )}
                  </div>
              </div>

              <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl p-6 text-white shadow-md">
                  <h3 className="font-bold mb-2">Projected Savings</h3>
                  <div className="text-3xl font-bold mb-1">
                      £{isSimulating ? '---,---' : (analysisResult ? savings.toLocaleString() : '0')}
                  </div>
                  <div className="text-blue-200 text-xs mb-4">Potential cost reduction via optimization</div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-white h-full transition-all duration-1000" style={{width: isSimulating ? '0%' : (score > 0 ? `${score}%` : '0%')}}></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MLInsightsView;
