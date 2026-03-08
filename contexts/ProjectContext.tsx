
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Project, Task, TeamMember, ProjectDocument, UserRole, Client, InventoryItem, Zone, RFI, PunchItem, DailyLog, Daywork, SafetyIncident, Equipment, Timesheet } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/db';

interface ProjectContextType {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  documents: ProjectDocument[];
  clients: Client[];
  inventory: InventoryItem[];
  rfis: RFI[];
  punchItems: PunchItem[];
  dailyLogs: DailyLog[];
  dayworks: Daywork[];
  safetyIncidents: SafetyIncident[];
  equipment: Equipment[];
  timesheets: Timesheet[];
  isLoading: boolean;
  
  // Project CRUD
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  addZone: (projectId: string, zone: Zone) => void;

  // Task CRUD
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  
  // Team CRUD
  addTeamMember: (member: TeamMember) => void;
  
  // Document CRUD
  addDocument: (doc: ProjectDocument) => void;
  updateDocument: (id: string, updates: Partial<ProjectDocument>) => void;

  // Client CRUD
  addClient: (client: Client) => void;
  
  // Inventory CRUD
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;

  // New Actions
  addRFI: (rfi: RFI) => Promise<void>;
  addPunchItem: (item: PunchItem) => Promise<void>;
  addDailyLog: (log: DailyLog) => Promise<void>;
  addDaywork: (dw: Daywork) => Promise<void>;

  // Backend Extensions
  addSafetyIncident: (incident: SafetyIncident) => Promise<void>;
  updateSafetyIncident: (id: string, updates: Partial<SafetyIncident>) => Promise<void>;
  addEquipment: (item: Equipment) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  addTimesheet: (sheet: Timesheet) => Promise<void>;
  updateTimesheet: (id: string, updates: Partial<Timesheet>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, addProjectId } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [dayworks, setDayworks] = useState<Daywork[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [p, t, tm, d, c, i, r, pi, dl, dw, si, eq, ts] = await Promise.all([
          db.getProjects(),
          db.getTasks(),
          db.getTeam(),
          db.getDocuments(),
          db.getClients(),
          db.getInventory(),
          db.getRFIs(),
          db.getPunchItems(),
          db.getDailyLogs(),
          db.getDayworks(),
          db.getSafetyIncidents(),
          db.getEquipment(),
          db.getTimesheets()
        ]);
        setProjects(p);
        setTasks(t);
        setTeamMembers(tm);
        setDocuments(d);
        setClients(c);
        setInventory(i);
        setRFIs(r);
        setPunchItems(pi);
        setDailyLogs(dl);
        setDayworks(dw);
        setSafetyIncidents(si);
        setEquipment(eq);
        setTimesheets(ts);
      } catch (e) {
        console.error("Failed to load data from DB", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- RBAC & Multi-tenant Filtering ---
  const visibleProjects = useMemo(() => {
      if (!user) return [];
      if (user.role === UserRole.SUPER_ADMIN) {
          return projects;
      }
      return projects.filter(p => p.companyId === user.companyId);
  }, [projects, user]);

  const visibleProjectIds = useMemo(() => visibleProjects.map(p => p.id), [visibleProjects]);

  const visibleTasks = useMemo(() => {
      return tasks.filter(t => visibleProjectIds.includes(t.projectId));
  }, [tasks, visibleProjectIds]);

  const visibleTeam = useMemo(() => {
      if (!user) return [];
      if (user.role === UserRole.SUPER_ADMIN) return teamMembers;
      return teamMembers.filter(m => m.companyId === user.companyId);
  }, [teamMembers, user]);

  const visibleDocs = useMemo(() => {
      return documents.filter(d => visibleProjectIds.includes(d.projectId));
  }, [documents, visibleProjectIds]);

  const visibleClients = useMemo(() => {
      if (!user) return [];
      if (user.role === UserRole.SUPER_ADMIN) return clients;
      return clients.filter(c => c.companyId === user.companyId);
  }, [clients, user]);

  const visibleInventory = useMemo(() => {
      if (!user) return [];
      if (user.role === UserRole.SUPER_ADMIN) return inventory;
      return inventory.filter(i => i.companyId === user.companyId);
  }, [inventory, user]);

  // Note: Safety, Equipment, Timesheets filtered in views or here if they have companyId
  // Assuming seed data uses 'c1' for companyId where possible or inferred from project.
  const visibleSafety = safetyIncidents; // Filter in view by project if needed
  const visibleEquipment = useMemo(() => {
      if (!user) return [];
      if (user.role === UserRole.SUPER_ADMIN) return equipment;
      return equipment.filter(e => e.companyId === user.companyId);
  }, [equipment, user]);
  const visibleTimesheets = useMemo(() => {
      if (!user) return [];
      if (user.role === UserRole.SUPER_ADMIN) return timesheets;
      return timesheets.filter(t => t.companyId === user.companyId);
  }, [timesheets, user]);


  // --- Project Methods ---
  const addProject = async (project: Project) => {
    const projectWithTenant = { ...project, companyId: user?.companyId || 'c1' };
    setProjects((prev) => [projectWithTenant, ...prev]);
    if (user && user.role !== UserRole.SUPER_ADMIN && addProjectId) {
        addProjectId(projectWithTenant.id);
    }
    await db.addProject(projectWithTenant);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await db.updateProject(id, updates);
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await db.deleteProject(id);
  };

  const getProject = (id: string) => {
    return visibleProjects.find((p) => p.id === id);
  };

  const addZone = async (projectId: string, zone: Zone) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              const updatedZones = [...(p.zones || []), zone];
              return { ...p, zones: updatedZones };
          }
          return p;
      }));
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const updatedZones = [...(project.zones || []), zone];
          await db.updateProject(projectId, { zones: updatedZones });
      }
  };

  // --- Task Methods ---
  const addTask = async (task: Task) => {
    setTasks(prev => [task, ...prev]);
    setProjects(prev => prev.map(p => {
            if (p.id === task.projectId) {
                return { ...p, tasks: { ...p.tasks, total: p.tasks.total + 1 } };
            }
            return p;
    }));
    await db.addTask(task);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await db.updateTask(id, updates);
  };

  // --- Team Methods ---
  const addTeamMember = async (member: TeamMember) => {
    const memberWithTenant = { ...member, companyId: user?.companyId || 'c1' };
    setTeamMembers(prev => [memberWithTenant, ...prev]);
    await db.addTeamMember(memberWithTenant);
  };

  // --- Document Methods ---
  const addDocument = async (doc: ProjectDocument) => {
    setDocuments(prev => [doc, ...prev]);
    await db.addDocument(doc);
  };

  const updateDocument = async (id: string, updates: Partial<ProjectDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    await db.updateDocument(id, updates);
  };

  // --- Client Methods ---
  const addClient = async (client: Client) => {
      const clientWithTenant = { ...client, companyId: user?.companyId || 'c1' };
      setClients(prev => [...prev, clientWithTenant]);
      await db.addClient(clientWithTenant);
  };

  // --- Inventory Methods ---
  const addInventoryItem = async (item: InventoryItem) => {
      const itemWithTenant = { ...item, companyId: user?.companyId || 'c1' };
      setInventory(prev => [...prev, itemWithTenant]);
      await db.addInventoryItem(itemWithTenant);
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
      setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      await db.updateInventoryItem(id, updates);
  };

  // --- New Methods ---
  const addRFI = async (item: RFI) => {
      setRFIs(prev => [item, ...prev]);
      await db.addRFI(item);
  };

  const addPunchItem = async (item: PunchItem) => {
      setPunchItems(prev => [item, ...prev]);
      await db.addPunchItem(item);
  };

  const addDailyLog = async (item: DailyLog) => {
      setDailyLogs(prev => [item, ...prev]);
      await db.addDailyLog(item);
  };

  const addDaywork = async (item: Daywork) => {
      setDayworks(prev => [item, ...prev]);
      await db.addDaywork(item);
  };

  // --- Backend Extension Methods ---
  const addSafetyIncident = async (item: SafetyIncident) => {
      setSafetyIncidents(prev => [item, ...prev]);
      await db.addSafetyIncident(item);
  };
  
  const updateSafetyIncident = async (id: string, updates: Partial<SafetyIncident>) => {
      setSafetyIncidents(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      await db.updateSafetyIncident(id, updates);
  };

  const addEquipment = async (item: Equipment) => {
      const itemWithTenant = { ...item, companyId: user?.companyId || 'c1' };
      setEquipment(prev => [itemWithTenant, ...prev]);
      await db.addEquipment(itemWithTenant);
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
      setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      await db.updateEquipment(id, updates);
  };

  const addTimesheet = async (item: Timesheet) => {
      const itemWithTenant = { ...item, companyId: user?.companyId || 'c1' };
      setTimesheets(prev => [itemWithTenant, ...prev]);
      await db.addTimesheet(itemWithTenant);
  };

  const updateTimesheet = async (id: string, updates: Partial<Timesheet>) => {
      setTimesheets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      await db.updateTimesheet(id, updates);
  };

  return (
    <ProjectContext.Provider value={{
        projects: visibleProjects, 
        tasks: visibleTasks,       
        teamMembers: visibleTeam,  
        documents: visibleDocs,    
        clients: visibleClients,
        inventory: visibleInventory,
        rfis,
        punchItems,
        dailyLogs,
        dayworks,
        safetyIncidents: visibleSafety,
        equipment: visibleEquipment,
        timesheets: visibleTimesheets,
        isLoading,
        addProject,
        updateProject,
        deleteProject,
        getProject,
        addZone,
        addTask,
        updateTask,
        addTeamMember,
        addDocument,
        updateDocument,
        addClient,
        addInventoryItem,
        updateInventoryItem,
        addRFI,
        addPunchItem,
        addDailyLog,
        addDaywork,
        addSafetyIncident,
        updateSafetyIncident,
        addEquipment,
        updateEquipment,
        addTimesheet,
        updateTimesheet
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
