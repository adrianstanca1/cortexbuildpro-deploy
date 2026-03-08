
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { 
  Project, Task, TeamMember, ProjectDocument, ProjectDrawing, 
  SitePhoto, UserRole, Client, InventoryItem, Zone, RFI, 
  PunchItem, DailyLog, Daywork, SafetyIncident, Equipment, 
  Timesheet, Invoice, ChangeOrder, TaskComment, SubTask
} from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/db';

interface ProjectContextType {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  documents: ProjectDocument[];
  drawings: ProjectDrawing[];
  photos: SitePhoto[];
  clients: Client[];
  inventory: InventoryItem[];
  rfis: RFI[];
  changeOrders: ChangeOrder[];
  punchItems: PunchItem[];
  dailyLogs: DailyLog[];
  dayworks: Daywork[];
  safetyIncidents: SafetyIncident[];
  equipment: Equipment[];
  timesheets: Timesheet[];
  invoices: Invoice[];
  isLoading: boolean;
  isAiProcessing: boolean;
  setAiProcessing: (processing: boolean) => void;
  refreshAllData: () => Promise<void>;
  
  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  addZone: (projectId: string, zone: Zone) => Promise<void>;

  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addTaskComment: (taskId: string, commentText: string) => Promise<void>;
  
  addTeamMember: (member: TeamMember) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  
  addDocument: (doc: ProjectDocument) => Promise<void>;
  updateDocument: (id: string, updates: Partial<ProjectDocument>) => Promise<void>;
  addDrawing: (drawing: ProjectDrawing) => Promise<void>;
  updateDrawing: (id: string, updates: Partial<ProjectDrawing>) => Promise<void>;
  addPhoto: (photo: SitePhoto) => Promise<void>;

  addClient: (client: Client) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;

  addRFI: (rfi: RFI) => Promise<void>;
  updateRFI: (id: string, updates: Partial<RFI>) => Promise<void>;
  addChangeOrder: (co: ChangeOrder) => Promise<void>;
  updateChangeOrder: (id: string, updates: Partial<ChangeOrder>) => Promise<void>;
  addPunchItem: (item: PunchItem) => Promise<void>;
  updatePunchItem: (id: string, updates: Partial<PunchItem>) => Promise<void>;
  addDailyLog: (log: DailyLog) => Promise<void>;
  addDaywork: (dw: Daywork) => Promise<void>;
  addSafetyIncident: (incident: SafetyIncident) => Promise<void>;
  updateSafetyIncident: (id: string, updates: Partial<SafetyIncident>) => Promise<void>;
  addEquipment: (item: Equipment) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  addTimesheet: (sheet: Timesheet) => Promise<void>;
  updateTimesheet: (id: string, updates: Partial<Timesheet>) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within a ProjectProvider');
  return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, addProjectId } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [drawings, setDrawings] = useState<ProjectDrawing[]>([]);
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [dayworks, setDayworks] = useState<Daywork[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const tid = user.role === UserRole.SUPER_ADMIN ? 'ALL' : user.companyId;

    try {
      const [p, t, tm, d, dr, ph, c, i, r, co, pi, dl, dw, si, eq, ts, inv] = await Promise.all([
        db.getProjects(tid),
        db.getTasks(tid),
        db.getTeam(tid),
        db.getDocuments(tid),
        db.getDrawings(tid),
        db.getPhotos(tid),
        db.getClients(tid),
        db.getInventory(tid),
        db.getRFIs(tid),
        db.getChangeOrders(tid),
        db.getPunchItems(tid),
        db.getDailyLogs(tid),
        db.getDayworks(tid),
        db.getSafetyIncidents(tid),
        db.getEquipment(tid),
        db.getTimesheets(tid),
        db.getInvoices(tid)
      ]);
      setProjects(p);
      setTasks(t);
      setTeamMembers(tm);
      setDocuments(d);
      setDrawings(dr);
      setPhotos(ph);
      setClients(c);
      setInventory(i);
      setRFIs(r);
      setChangeOrders(co);
      setPunchItems(pi);
      setDailyLogs(dl);
      setDayworks(dw);
      setSafetyIncidents(si);
      setEquipment(eq);
      setTimesheets(ts);
      setInvoices(inv);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    db.subscribe((msg) => {
        if (msg.companyId === user?.companyId || user?.role === UserRole.SUPER_ADMIN) {
            loadData();
        }
    });
  }, [user, loadData]);

  const addProject = async (p: Project) => {
    const cid = user?.companyId || 'c1';
    await db.addProject({ ...p, companyId: cid });
    if (user && user.role !== UserRole.SUPER_ADMIN) addProjectId(p.id);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    await db.updateProject(id, updates);
  };

  const deleteProject = async (id: string) => {
    await db.deleteProject(id);
  };

  const getProject = (id: string) => projects.find(p => p.id === id);

  const addZone = async (projectId: string, zone: Zone) => {
      const p = projects.find(x => x.id === projectId);
      if (p) {
          const updatedZones = [...(p.zones || []), zone];
          await db.updateProject(projectId, { zones: updatedZones });
      }
  };

  const addTask = async (t: Task) => {
    const cid = user?.companyId || 'c1';
    await db.addTask({ ...t, companyId: cid });
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await db.updateTask(id, updates);
  };

  const addTaskComment = async (taskId: string, text: string) => {
      if (!user) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const comment: TaskComment = {
          id: `comment-${Date.now()}`,
          taskId,
          authorId: user.id,
          authorName: user.name,
          authorInitials: user.avatarInitials,
          authorColor: user.role === UserRole.SUPER_ADMIN ? 'bg-midnight' : 'bg-primary',
          text,
          timestamp: new Date().toISOString()
      };

      const updatedComments = [...(task.comments || []), comment];
      await db.updateTask(taskId, { comments: updatedComments });
  };

  const addTeamMember = async (m: TeamMember) => {
    const cid = user?.companyId || 'c1';
    await db.addTeamMember({ ...m, companyId: cid });
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    await db.update('team', id, updates);
  };

  const deleteTeamMember = async (id: string) => {
    await db.delete('team', id, user?.companyId);
  };

  const addDocument = async (doc: ProjectDocument) => {
    const cid = user?.companyId || 'c1';
    await db.addDocument({ ...doc, companyId: cid });
  };

  const updateDocument = async (id: string, updates: Partial<ProjectDocument>) => {
    await db.updateDocument(id, updates);
  };

  const addDrawing = async (drawing: ProjectDrawing) => {
    const cid = user?.companyId || 'c1';
    await db.addDrawing({ ...drawing, companyId: cid });
  };

  const updateDrawing = async (id: string, updates: Partial<ProjectDrawing>) => {
    await db.updateDrawing(id, updates);
  };

  const addPhoto = async (photo: SitePhoto) => {
    const cid = user?.companyId || 'c1';
    await db.addPhoto({ ...photo, companyId: cid });
  };

  const addClient = async (c: Client) => {
      const cid = user?.companyId || 'c1';
      await db.addClient({ ...c, companyId: cid });
  };

  const addInventoryItem = async (i: InventoryItem) => {
      const cid = user?.companyId || 'c1';
      await db.addInventoryItem({ ...i, companyId: cid });
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
      await db.updateInventoryItem(id, updates);
  };

  const addRFI = async (item: RFI) => { 
    const cid = user?.companyId || 'c1';
    await db.addRFI({ ...item, companyId: cid });
  };
  const updateRFI = async (id: string, updates: Partial<RFI>) => {
    await db.updateRFI(id, updates);
  };

  const addChangeOrder = async (co: ChangeOrder) => {
      const cid = user?.companyId || 'c1';
      await db.addChangeOrder({ ...co, companyId: cid });
  };
  const updateChangeOrder = async (id: string, updates: Partial<ChangeOrder>) => {
      await db.updateChangeOrder(id, updates);
  };

  const addPunchItem = async (item: PunchItem) => { 
    const cid = user?.companyId || 'c1';
    await db.addPunchItem({ ...item, companyId: cid });
  };
  const updatePunchItem = async (id: string, updates: Partial<PunchItem>) => {
    await db.updatePunchItem(id, updates);
  };
  const addDailyLog = async (item: DailyLog) => { 
    const cid = user?.companyId || 'c1';
    await db.addDailyLog({ ...item, companyId: cid });
  };
  const addDaywork = async (item: Daywork) => { 
    const cid = user?.companyId || 'c1';
    await db.addDaywork({ ...item, companyId: cid });
  };
  const addSafetyIncident = async (item: SafetyIncident) => { 
    const cid = user?.companyId || 'c1';
    await db.addSafetyIncident({ ...item, companyId: cid });
  };
  const updateSafetyIncident = async (id: string, u: Partial<SafetyIncident>) => { 
    await db.updateSafetyIncident(id, u);
  };
  const addEquipment = async (item: Equipment) => { 
    const cid = user?.companyId || 'c1';
    await db.addEquipment({ ...item, companyId: cid });
  };
  const updateEquipment = async (id: string, u: Partial<Equipment>) => { 
    await db.updateEquipment(id, u);
  };
  const addTimesheet = async (item: Timesheet) => { 
    const cid = user?.companyId || 'c1';
    await db.addTimesheet({ ...item, companyId: cid });
  };
  const updateTimesheet = async (id: string, u: Partial<Timesheet>) => { 
    await db.updateTimesheet(id, u);
  };
  const addInvoice = async (invoice: Invoice) => {
    const cid = user?.companyId || 'c1';
    await db.addInvoice({ ...invoice, companyId: cid });
  };
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    await db.updateInvoice(id, updates);
  };
  const deleteInvoice = async (id: string) => {
      await db.deleteInvoice(id);
  };

  return (
    <ProjectContext.Provider value={{
        projects, tasks, teamMembers, documents, drawings, photos, clients, inventory,
        rfis, changeOrders, punchItems, dailyLogs, dayworks, safetyIncidents, equipment,
        timesheets, invoices, isLoading, isAiProcessing,
        setAiProcessing: setIsAiProcessing,
        refreshAllData: loadData,
        addProject, updateProject, deleteProject, getProject, addZone,
        addTask, updateTask, addTaskComment, addTeamMember, updateTeamMember, deleteTeamMember, addDocument, updateDocument, addDrawing, updateDrawing, addPhoto,
        addClient, addInventoryItem, updateInventoryItem, addRFI, updateRFI, addChangeOrder, updateChangeOrder, addPunchItem, updatePunchItem,
        addDailyLog, addDaywork, addSafetyIncident, updateSafetyIncident,
        addEquipment, updateEquipment, addTimesheet, updateTimesheet,
        addInvoice, updateInvoice, deleteInvoice
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
