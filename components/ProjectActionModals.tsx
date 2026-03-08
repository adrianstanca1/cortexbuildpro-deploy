import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, HelpCircle, CheckSquare, Clipboard, Hammer, Camera, Upload, 
  Calendar, User, FileText, AlertTriangle, Plus, ImageIcon, 
  Loader2, ScanLine, Trash2, Paperclip, PoundSterling, Database, Box,
  CheckCircle2, RefreshCw, Send, ShieldCheck, History, Info, 
  Receipt, Zap, MinusCircle, ListPlus, Target, BrainCircuit,
  Sparkles, Check, Eye, ChevronDown, Building2, Hash, Edit3, GitMerge,
  Search, PlusSquare, ChevronRight, Layers, FileUp, Mic, Square,
  BadgeCheck, TrendingDown, Layout, Globe
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { RFI, PunchItem, DailyLog, Daywork, ProjectDocument, SitePhoto, ProjectDrawing, Invoice, InvoiceItem, Task, ChangeOrder } from '../types';
import { runRawPrompt, parseAIJSON, analyzeInvoiceImage, checkMarketPricing, transcribeAudio, generateSpeech } from '../services/geminiService';

type ModalType = 'RFI' | 'PUNCH' | 'LOG' | 'DAYWORK' | 'PHOTO' | 'DRAWING' | 'INVOICE' | 'CHANGE_ORDER';

interface ProjectActionModalsProps {
  type: ModalType | null;
  projectId?: string;
  onClose: () => void;
  targetDrawing?: ProjectDrawing;
}

export const ProjectActionModals: React.FC<ProjectActionModalsProps> = ({ type, projectId, onClose, targetDrawing }) => {
  const { user } = useAuth();
  const { drawings, tasks, teamMembers, projects, addRFI, addChangeOrder, addPunchItem, addDailyLog, addDaywork, addPhoto, addDrawing, addDocument, addInvoice } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // Media State
  const [preview, setPreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{name: string, size: string, type: string} | null>(null);
  const [drawingCategory, setDrawingCategory] = useState<any>('Structural');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [drawingName, setDrawingName] = useState('');
  const [drawingLinkedTaskIds, setDrawingLinkedTaskIds] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState('');

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // RFI Form State
  const [rfiForm, setRfiForm] = useState<{
    subject: string;
    question: string;
    assignedTo: string;
    dueDate: string;
    linkedTaskIds: string[];
    attachments: { name: string; url: string; type: string }[];
  }>({
    subject: '',
    question: '',
    assignedTo: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    linkedTaskIds: [],
    attachments: []
  });

  // Change Order Form State
  const [coData, setCoData] = useState<Partial<ChangeOrder>>({
      title: '',
      description: '',
      reason: '',
      amount: 0,
      scheduleImpactDays: 0,
      status: 'Pending'
  });

  // --- Invoice Form State ---
  const [invoiceData, setInvoiceData] = useState<{
    vendorName: string;
    invoiceNumber: string;
    dueDate: string;
    description: string;
    projectId: string;
    items: InvoiceItem[];
    linkedTaskIds: string[];
    aiAuditNotes?: string;
    marketVariance?: any;
  }>({
    vendorName: '',
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: '',
    projectId: projectId || '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    linkedTaskIds: []
  });

  const activeProjectId = (type === 'INVOICE' ? invoiceData.projectId : projectId) || projects[0]?.id;
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === activeProjectId), [tasks, activeProjectId]);
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  const filteredTasks = useMemo(() => 
    projectTasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()))
  , [projectTasks, taskSearch]);

  const invoiceTotal = useMemo(() => {
    return invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [invoiceData.items]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rfiFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (targetDrawing && type === 'DRAWING') {
      setDrawingName(targetDrawing.name);
      setDrawingCategory(targetDrawing.category);
      setDrawingLinkedTaskIds(targetDrawing.linkedTaskIds || []);
    } else {
      setDrawingName('');
      setDrawingCategory('Structural');
      setDrawingLinkedTaskIds([]);
    }
    setRevisionNotes('');
    setPreview(null);
    setFileMeta(null);
    setTaskSearch('');
    
    if (type === 'INVOICE') {
      setInvoiceData(prev => ({
          ...prev,
          projectId: projectId || prev.projectId || (projects[0]?.id || ''),
          vendorName: '',
          description: '',
          invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
          items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
          linkedTaskIds: [],
          aiAuditNotes: undefined,
          marketVariance: undefined
      }));
    }

    if (type === 'RFI') {
      setRfiForm({
        subject: '',
        question: '',
        assignedTo: teamMembers[0]?.name || '',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        linkedTaskIds: [],
        attachments: []
      });
    }
  }, [targetDrawing, type, projectId, projects, teamMembers]);

  const handleAddItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      }
      return { ...prev, items: newItems };
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsAiGenerating(true);
          try {
            const transcript = await transcribeAudio(base64Audio, 'audio/webm');
            if (type === 'INVOICE') setInvoiceData(prev => ({ ...prev, description: prev.description + ' ' + transcript }));
            if (type === 'RFI') setRfiForm(prev => ({ ...prev, question: prev.question + ' ' + transcript }));
          } finally {
            setIsAiGenerating(false);
          }
        };
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Microphone access needed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleScanInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiGenerating(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const data = await analyzeInvoiceImage(base64, file.type);
        setInvoiceData(prev => ({
          ...prev,
          vendorName: data.vendorName || prev.vendorName,
          invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
          dueDate: data.dueDate || prev.dueDate,
          description: data.description || prev.description,
          items: data.items?.map((it: any) => ({ ...it, total: it.quantity * it.unitPrice })) || prev.items
        }));
      } finally {
        setIsAiGenerating(false);
      }
    };
  };

  const handleVerifyMarketPricing = async () => {
    if (!invoiceData.items.length) return;
    setIsAiGenerating(true);
    try {
        const pricingItems = invoiceData.items.map(it => ({ description: it.description, price: it.unitPrice }));
        const result = await checkMarketPricing(pricingItems, activeProject?.location || 'London');
        setInvoiceData(prev => ({ ...prev, marketVariance: result }));
    } catch (e) {
        console.error("Market verification failed", e);
    } finally {
        setIsAiGenerating(false);
    }
  };

  const handleImportTasks = () => {
    const completedTasks = projectTasks.filter(t => t.status === 'Done');
    if (completedTasks.length === 0) {
        alert("No completed objective shards found for import. Ensure tasks are marked 'Done' in the objectives matrix.");
        return;
    }
    
    const newItems: InvoiceItem[] = completedTasks.map(t => ({
        description: `Deliverable Completion: ${t.title}`,
        quantity: 1,
        unitPrice: t.priority === 'Critical' ? 2500 : t.priority === 'High' ? 1500 : 1000, 
        total: t.priority === 'Critical' ? 2500 : t.priority === 'High' ? 1500 : 1000
    }));

    setInvoiceData(prev => ({
        ...prev,
        items: [...prev.items.filter(it => it.description !== ''), ...newItems],
        linkedTaskIds: [...new Set([...prev.linkedTaskIds, ...completedTasks.map(t => t.id)])]
    }));
  };

  const handleAIAuditInvoice = async () => {
    if (!invoiceData.items.length || !activeProjectId) return;
    setIsAiGenerating(true);
    try {
        const project = projects.find(p => p.id === activeProjectId);
        const projectTasks = tasks.filter(t => t.projectId === activeProjectId);
        const context = {
            projectName: project?.name,
            projectDescription: project?.description,
            tasks: projectTasks.map(t => `${t.title} (${t.status})`),
            invoiceItems: invoiceData.items.map(it => it.description)
        };

        const prompt = `
            Act as a Forensic Construction Auditor.
            Audit this invoice against the project scope.
            Context: ${JSON.stringify(context)}
            Check for: 
            1. Items outside the defined project scope.
            2. Potential double billing (double billing from the same vendor).
            3. Discrepancies with task progress.
            Provide a concise audit brief.
        `;
        const res = await runRawPrompt(prompt, { 
          model: 'gemini-3-pro-preview', 
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 32768 } 
        });
        setInvoiceData(prev => ({ ...prev, aiAuditNotes: res.trim() }));
    } catch (e) {
        console.error("Audit failed", e);
    } finally {
        setIsAiGenerating(false);
    }
  };

  const handleToggleTaskLink = (taskId: string) => {
    if (type === 'INVOICE') {
      setInvoiceData(prev => ({
        ...prev,
        linkedTaskIds: prev.linkedTaskIds.includes(taskId)
          ? prev.linkedTaskIds.filter(id => id !== taskId)
          : [...prev.linkedTaskIds, taskId]
      }));
    } else if (type === 'RFI') {
      setRfiForm(prev => ({
        ...prev,
        linkedTaskIds: prev.linkedTaskIds.includes(taskId)
          ? prev.linkedTaskIds.filter(id => id !== taskId)
          : [...prev.linkedTaskIds, taskId]
      }));
    }
  };

  const handleSubmitInvoice = async () => {
    if (!invoiceData.vendorName || invoiceTotal === 0 || !activeProjectId) return;
    setIsSubmitting(true);
    try {
      const entry: Invoice = {
        id: `inv-${Date.now()}`,
        projectId: activeProjectId,
        projectName: activeProject?.name,
        projectCode: activeProject?.code,
        invoiceNumber: invoiceData.invoiceNumber,
        vendorName: invoiceData.vendorName,
        amount: invoiceTotal,
        dueDate: invoiceData.dueDate,
        status: 'Pending',
        description: invoiceData.description,
        createdAt: new Date().toISOString(),
        companyId: user?.companyId || 'c1',
        items: invoiceData.items,
        linkedTaskIds: invoiceData.linkedTaskIds,
        aiAuditNotes: invoiceData.aiAuditNotes
      };
      await addInvoice(entry);
      await generateSpeech(`Invoice ${entry.invoiceNumber} has been synchronized with the project ledger.`);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDrawingTaskLink = (taskId: string) => {
    setDrawingLinkedTaskIds(prev => 
        prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const handleFileLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFileMeta({
              name: file.name,
              size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
              type: file.type
          });
          if (!drawingName) setDrawingName(file.name);
          const reader = new FileReader();
          reader.onloadend = () => setPreview(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleRfiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAiGenerating(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        setRfiForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, { name: file.name, url, type: file.type }]
        }));
        
        // Use AI to extract subject/question from the uploaded artifact
        try {
          const prompt = `Analyze this construction artifact and extract a technical RFI Subject and Question. Return JSON: { "subject": "string", "question": "string" }`;
          const base64 = url.split(',')[1];
          const res = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 2048 }
          }, base64, file.type);
          const data = parseAIJSON(res);
          setRfiForm(prev => ({
            ...prev,
            subject: data.subject || prev.subject,
            question: data.question || prev.question
          }));
        } catch (err) {
          console.error("RFI artifact analysis failed", err);
        } finally {
          setIsAiGenerating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitMedia = async () => {
      if (!preview || !fileMeta || !activeProjectId) return;
      setIsSubmitting(true);

      try {
          if (type === 'PHOTO') {
              const newPhoto: SitePhoto = {
                  id: `ph-${Date.now()}`,
                  name: fileMeta.name,
                  projectId: activeProjectId,
                  companyId: user?.companyId || 'c1',
                  uploader: user?.name || 'Current User',
                  date: new Date().toLocaleDateString(),
                  url: preview
              };
              await addPhoto(newPhoto);
          } else if (type === 'DRAWING') {
              const existingMatches = drawings.filter(d => d.projectId === activeProjectId && d.name === (drawingName || fileMeta.name));
              const latestVersion = existingMatches.reduce((max, d) => Math.max(max, d.version || 0), 0);
              
              const newDrawing: ProjectDrawing = {
                  id: `dr-${Date.now()}`,
                  name: drawingName || fileMeta.name,
                  type: fileMeta.name.endsWith('.dwg') ? 'DWG' : 'PDF',
                  category: drawingCategory,
                  projectId: activeProjectId,
                  companyId: user?.companyId || 'c1',
                  uploader: user?.name || 'Current User',
                  date: new Date().toLocaleDateString(),
                  size: fileMeta.size,
                  url: preview,
                  version: latestVersion + 1,
                  revisionNotes: revisionNotes,
                  linkedTaskIds: drawingLinkedTaskIds
              };
              await addDrawing(newDrawing);
          }
          onClose();
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleSubmitCO = async () => {
    if (!coData.title || !activeProjectId) return;
    setIsSubmitting(true);
    try {
        const entry: ChangeOrder = {
            id: `co-${Date.now()}`,
            projectId: activeProjectId,
            companyId: user?.companyId || 'c1',
            number: `CO-${Math.floor(Math.random() * 900) + 100}`,
            title: coData.title!,
            description: coData.description || '',
            reason: coData.reason || '',
            amount: Number(coData.amount) || 0,
            scheduleImpactDays: Number(coData.scheduleImpactDays) || 0,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };
        await addChangeOrder(entry);
        await generateSpeech(`Change Order ${entry.number} initiated. Impact valuation of ${entry.amount} pounds recorded.`);
        onClose();
    } finally {
        setIsSubmitting(false);
    }
};

const handleSubmitRFI = async () => {
    if (!rfiForm.subject || !rfiForm.question || !activeProjectId) return;
    setIsSubmitting(true);
    try {
        const entry: RFI = {
            id: `rfi-${Date.now()}`,
            projectId: activeProjectId,
            companyId: user?.companyId || 'c1',
            number: `RFI-${Math.floor(Math.random() * 900) + 100}`,
            subject: rfiForm.subject,
            question: rfiForm.question,
            assignedTo: rfiForm.assignedTo || 'Unassigned',
            status: 'Open',
            dueDate: rfiForm.dueDate,
            createdAt: new Date().toISOString(),
            linkedTaskIds: rfiForm.linkedTaskIds,
            attachments: rfiForm.attachments
        };
        await addRFI(entry);
        await generateSpeech(`RFI ${entry.number} has been logged and assigned to ${entry.assignedTo}.`);
        onClose();
    } finally {
        setIsSubmitting(false);
    }
};

  if (!type) return null;

  return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`bg-white w-full ${type === 'INVOICE' || type === 'RFI' || type === 'DRAWING' || type === 'CHANGE_ORDER' ? 'max-w-6xl' : 'max-w-lg'} rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/20 flex flex-col max-h-[95vh]`}>
              <div className="p-8 border-b flex justify-between items-center bg-zinc-50/50 shrink-0">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                          {type === 'PHOTO' && <Camera size={24} />}
                          {type === 'DRAWING' && <Box size={24} />}
                          {type === 'RFI' && <HelpCircle size={24} />}
                          {type === 'CHANGE_ORDER' && <RefreshCw size={24} />}
                          {type === 'INVOICE' && <Receipt size={24} />}
                      </div>
                      <div>
                        <h3 className="font-black text-zinc-900 tracking-tight uppercase leading-none mb-1">
                            {type === 'CHANGE_ORDER' ? 'Initialize Scope Variation' : 
                             type === 'INVOICE' ? 'Provision Project Ledger Node' : 
                             type === 'DRAWING' ? (targetDrawing ? 'Blueprint Revision' : 'New Blueprint Set') : 
                             type === 'PHOTO' ? 'Site Visual Record' :
                             type === 'RFI' ? 'Raise Technical Inquiry (RFI)' :
                             'Site Protocol Injection'}
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {activeProject?.name || 'Global Cluster'} • ID: {Date.now().toString().slice(-8)}
                        </p>
                      </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"><X size={24} /></button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                {type === 'RFI' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                      <div className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer relative overflow-hidden" onClick={() => rfiFileInputRef.current?.click()}>
                          <input type="file" ref={rfiFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleRfiFileUpload} />
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><HelpCircle size={80} /></div>
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-purple-100 group-hover:bg-primary group-hover:text-white transition-all">
                              {isAiGenerating ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                          </div>
                          <div>
                              <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Upload Technical Artifact</p>
                              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">Extract RFI scope & query using Gemini 3 Pro reasoning</p>
                          </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Inquiry Subject</label>
                            <input type="text" className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase" placeholder="e.g. Facade Anchor Structural Variance" value={rfiForm.subject} onChange={e => setRfiForm({...rfiForm, subject: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Technical Question</label>
                                <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${isRecording ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-zinc-100 text-zinc-500 hover:text-primary'}`}>
                                    <Mic size={12} /> Voice Shard
                                </button>
                            </div>
                            <textarea className="w-full p-6 h-40 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-sm font-medium outline-none italic resize-none shadow-inner" placeholder="Elaborate on the technical query requiring clarification..." value={rfiForm.question} onChange={e => setRfiForm({...rfiForm, question: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Assign Authority Node</label>
                            <select className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" value={rfiForm.assignedTo} onChange={e => setRfiForm({...rfiForm, assignedTo: e.target.value})}>
                                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name} - {m.role}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Settlement Target</label>
                            <input type="date" className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" value={rfiForm.dueDate} onChange={e => setRfiForm({...rfiForm, dueDate: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-8">
                       <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-1000"><ShieldCheck size={100} /></div>
                           <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Protocol Compliance</h4>
                           <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">"Technical RFIs are committed to the project registry and distributed to stakeholders. Gemini reasoning will stand by for response synthesis."</p>
                       </div>

                       <div className="flex-1 bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100 shadow-inner space-y-6 flex flex-col">
                           <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2"><GitMerge size={14} /> Objective Registry Link</h4>
                           <div className="relative group">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
                              <input type="text" placeholder="Trace project objective..." className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" value={taskSearch} onChange={e => setTaskSearch(e.target.value)} />
                           </div>
                           <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar max-h-64 pr-1">
                               {filteredTasks.map(task => (
                                   <div key={task.id} onClick={() => handleToggleTaskLink(task.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group/t ${rfiForm.linkedTaskIds.includes(task.id) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-zinc-100 hover:border-primary/40'}`}>
                                       <span className="text-[10px] font-black uppercase tracking-tight truncate">{task.title}</span>
                                       {rfiForm.linkedTaskIds.includes(task.id) ? <Check size={14} strokeWidth={4} /> : <Plus size={14} className="text-zinc-200 group-hover/t:text-primary" />}
                                   </div>
                               ))}
                           </div>
                       </div>
                    </div>
                  </div>
                )}

                {type === 'INVOICE' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                      <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer relative overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanInvoice} />
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Receipt size={80} /></div>
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-blue-100 group-hover:bg-primary group-hover:text-white transition-all">
                              {isAiGenerating ? <Loader2 size={24} className="animate-spin" /> : <ScanLine size={24} />}
                          </div>
                          <div>
                              <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Scan Physical Artifact</p>
                              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">Extract vendor, items, and valuations using Gemini 3 Pro</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {!projectId && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Project Cluster</label>
                            <select className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" value={invoiceData.projectId} onChange={e => setInvoiceData({...invoiceData, projectId: e.target.value})}>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Vendor Identity</label>
                            <input type="text" className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase" placeholder="e.g. Holcim Concrete" value={invoiceData.vendorName} onChange={e => setInvoiceData({...invoiceData, vendorName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Settlement Target</label>
                            <input type="date" className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" value={invoiceData.dueDate} onChange={e => setInvoiceData({...invoiceData, dueDate: e.target.value})} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                           <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"><Layout size={14} className="text-primary" /> Itemized Valuation</h4>
                           <div className="flex gap-4">
                             <button onClick={handleImportTasks} className="text-[10px] font-black text-emerald-600 hover:underline uppercase flex items-center gap-1.5 transition-all">
                                 <GitMerge size={12} /> Import Completed Shards
                             </button>
                             <button onClick={() => {}} className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline decoration-blue-200">
                                 <Sparkles size={12} /> AI Smart Itemize
                             </button>
                           </div>
                        </div>
                        <div className="space-y-3">
                           {invoiceData.items.map((item, i) => (
                             <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2" style={{ animationDelay: `${i * 50}ms` }}>
                               <input className="flex-1 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold uppercase tracking-tight" placeholder="Item description..." value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} />
                               <input type="number" className="w-24 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold text-center" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', parseInt(e.target.value) || 1)} />
                               <div className="relative w-32">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-black">£</span>
                                  <input type="number" className="w-full pl-8 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(i, 'unitPrice', parseFloat(e.target.value) || 0)} />
                               </div>
                               <button onClick={() => handleRemoveItem(i)} className="p-3 text-zinc-300 hover:text-red-500 transition-colors"><MinusCircle size={20} /></button>
                             </div>
                           ))}
                           <button onClick={handleAddItem} className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"><Plus size={16} /> Append Line Node</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol Description</label>
                            <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${isRecording ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-zinc-100 text-zinc-500 hover:text-primary'}`}>
                                <Mic size={12} /> {isRecording ? 'Capturing Voice Shard...' : 'Voice Note'}
                            </button>
                        </div>
                        <textarea className="w-full p-6 h-24 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-sm font-medium outline-none italic resize-none shadow-inner" placeholder="Provide context for this settlement node..." value={invoiceData.description} onChange={e => setInvoiceData({...invoiceData, description: e.target.value})} />
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-8">
                       <div className="bg-zinc-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-[3000ms]"><PoundSterling size={120} /></div>
                           <div className="relative z-10">
                              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Cumulative Valuation</div>
                              <div className="text-5xl font-black tracking-tighter text-primary">£{invoiceTotal.toLocaleString()}</div>
                              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-6">Awaiting Shard Commitment</p>
                           </div>
                       </div>

                       <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden group/audit">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/audit:scale-110 transition-transform"><BrainCircuit size={80} /></div>
                           <div className="flex justify-between items-center mb-2">
                             <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> Forensic Auditor</h4>
                             <button onClick={handleAIAuditInvoice} disabled={isAiGenerating || !invoiceData.items.length} className="text-[9px] font-black text-primary uppercase hover:underline disabled:opacity-50">Execute Logic Trace</button>
                           </div>
                           
                           {invoiceData.aiAuditNotes ? (
                               <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-xs text-zinc-600 leading-relaxed font-medium italic animate-in fade-in slide-in-from-bottom-2">
                                  "{invoiceData.aiAuditNotes}"
                               </div>
                           ) : (
                               <p className="text-[10px] text-zinc-400 font-medium leading-relaxed italic">Initialize the forensic node to verify items against project scope and detect potential billing drifts.</p>
                           )}

                           <div className="pt-4 border-t border-zinc-50 space-y-4">
                               <button onClick={handleVerifyMarketPricing} disabled={isAiGenerating || !invoiceData.items.length} className="w-full py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#0f5c82] hover:bg-white hover:border-primary transition-all flex items-center justify-center gap-2">
                                  <Globe size={14} /> Global Market Variance Check
                               </button>
                               {invoiceData.marketVariance && (
                                   <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[10px] text-emerald-800 font-bold uppercase tracking-tight animate-in zoom-in-95">
                                      <div className="flex justify-between mb-2"><span>Market Alignment:</span> <span className="text-emerald-600">Verified</span></div>
                                      <p className="opacity-70 normal-case font-medium italic">"{invoiceData.marketVariance.analysis}"</p>
                                   </div>
                               )}
                           </div>
                       </div>

                       <div className="flex-1 bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100 shadow-inner space-y-6 flex flex-col">
                           <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2"><GitMerge size={14} /> Objective Lattice Link</h4>
                           <div className="relative group">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
                              <input type="text" placeholder="Search objectives..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" value={taskSearch} onChange={e => setTaskSearch(e.target.value)} />
                           </div>
                           <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar max-h-40 pr-1">
                               {filteredTasks.map(task => (
                                   <div key={task.id} onClick={() => handleToggleTaskLink(task.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group/t ${invoiceData.linkedTaskIds.includes(task.id) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-zinc-100 hover:border-primary/40'}`}>
                                       <span className="text-[10px] font-black uppercase tracking-tight truncate">{task.title}</span>
                                       {invoiceData.linkedTaskIds.includes(task.id) ? <Check size={14} strokeWidth={4} /> : <Plus size={14} className="text-zinc-200 group-hover/t:text-primary" />}
                                   </div>
                               ))}
                           </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-10 border-t bg-zinc-50/50 shrink-0 flex justify-end gap-6">
                <button onClick={onClose} className="px-10 py-5 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-zinc-600 transition-colors">Discard Shard</button>
                <button 
                  onClick={type === 'INVOICE' ? handleSubmitInvoice : type === 'CHANGE_ORDER' ? handleSubmitCO : type === 'RFI' ? handleSubmitRFI : handleSubmitMedia}
                  disabled={isSubmitting || (type === 'INVOICE' && !invoiceData.vendorName) || (type === 'RFI' && !rfiForm.subject)}
                  className="px-12 py-5 bg-zinc-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 disabled:grayscale group/submit"
                >
                    {isSubmitting ? <Loader2 size={24} className="animate-spin text-primary" /> : <ShieldCheck size={24} className="text-emerald-500 group-hover/submit:scale-110 transition-transform" />}
                    {type === 'DRAWING' ? (targetDrawing ? 'Commit Revision Node' : 'Initialize Blueprint Shard') : 
                     type === 'INVOICE' ? 'Synchronize Shard Ledger' : 
                     type === 'CHANGE_ORDER' ? 'Authorize Shard Protocol' :
                     type === 'RFI' ? 'Initialize Technical RFI' :
                     'Inject Registry Shard'}
                </button>
              </div>
          </div>
      </div>
  );
};
