
import { Project, Task, TeamMember, ProjectDocument, Client, InventoryItem, RFI, PunchItem, DailyLog, Daywork, SafetyIncident, Equipment, Timesheet } from '../types';

// Database Configuration
const DB_NAME = 'BuildProDB';
const DB_VERSION = 3; 
const STORES = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TEAM: 'team',
  DOCUMENTS: 'documents',
  CLIENTS: 'clients',
  INVENTORY: 'inventory',
  RFIS: 'rfis',
  PUNCH_ITEMS: 'punch_items',
  DAILY_LOGS: 'daily_logs',
  DAYWORKS: 'dayworks',
  SAFETY_INCIDENTS: 'safety_incidents',
  EQUIPMENT: 'equipment',
  TIMESHEETS: 'timesheets'
};

// Initial Data Seeds
const SEED_DATA = {
  [STORES.PROJECTS]: [
    {
      id: 'p1',
      companyId: 'c1',
      name: 'City Centre Plaza Development',
      code: 'CCP-2025',
      description: 'A mixed-use development featuring 40 stories of office space and a luxury retail podium.',
      location: 'Downtown Metro',
      type: 'Commercial',
      status: 'Active',
      health: 'Good',
      progress: 74,
      budget: 25000000,
      spent: 18500000,
      startDate: '2025-01-15',
      endDate: '2026-12-31',
      manager: 'John Anderson',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      teamSize: 24,
      tasks: { total: 145, completed: 98, overdue: 2 },
      weatherLocation: { city: 'New York', temp: '72°', condition: 'Sunny' },
      aiAnalysis: 'Project is progressing ahead of schedule. Structural steel completion is imminent.'
    },
    {
      id: 'p2',
      companyId: 'c1',
      name: 'Residential Complex - Phase 2',
      code: 'RCP-002',
      description: 'Three tower residential complex with 400 units and shared amenities.',
      location: 'Westside Heights',
      type: 'Residential',
      status: 'Active',
      health: 'At Risk',
      progress: 45,
      budget: 18000000,
      spent: 16500000,
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      manager: 'Sarah Mitchell',
      image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      teamSize: 18,
      tasks: { total: 200, completed: 80, overdue: 12 },
      weatherLocation: { city: 'Chicago', temp: '65°', condition: 'Windy' }
    },
    {
        id: 'p3',
        companyId: 'c1',
        name: 'Highway Bridge Repair',
        code: 'HWY-95-REP',
        description: 'Structural reinforcement and resurfacing of the I-95 overpass.',
        location: 'Interstate 95',
        type: 'Infrastructure',
        status: 'Active',
        health: 'Good',
        progress: 12,
        budget: 3200000,
        spent: 400000,
        startDate: '2025-10-01',
        endDate: '2026-04-01',
        manager: 'David Chen',
        image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        teamSize: 45,
        tasks: { total: 50, completed: 5, overdue: 0 },
        weatherLocation: { city: 'Austin', temp: '88°', condition: 'Clear' }
    }
  ],
  [STORES.TASKS]: [
    { id: 't1', title: 'Safety inspection - Site A', description: 'Conduct full perimeter safety check including scaffolding tags and fall protection systems before concrete pour.', projectId: 'p1', status: 'To Do', priority: 'High', assigneeName: 'Mike Thompson', assigneeType: 'user', dueDate: '2025-11-12', dependencies: [], latitude: 40.7128, longitude: -74.0060 },
    { id: 't2', title: 'Concrete pouring - Level 2', description: 'Pour and finish slab for level 2 podium. Requires pump truck coordination.', projectId: 'p1', status: 'Blocked', priority: 'Critical', assigneeName: 'All Operatives', assigneeType: 'role', dueDate: '2025-11-20', dependencies: ['t1', 't3'], latitude: 40.7135, longitude: -74.0055 },
    { id: 't3', title: 'Complete foundation excavation', description: 'Finalize earthworks for the North wing foundation footings.', projectId: 'p1', status: 'In Progress', priority: 'High', assigneeName: 'David Chen', assigneeType: 'user', dueDate: '2025-11-15', dependencies: [], latitude: 40.7120, longitude: -74.0065 },
    { id: 't4', title: 'Install steel framework', description: 'Erect primary steel columns for sectors 1-4.', projectId: 'p1', status: 'Done', priority: 'High', assigneeName: 'David Chen', assigneeType: 'user', dueDate: '2025-11-08', dependencies: [] },
    { id: 't5', title: 'Quality control inspection', description: 'Verify rebar spacing and cover depth prior to pour.', projectId: 'p3', status: 'To Do', priority: 'High', assigneeName: 'John Anderson', assigneeType: 'user', dueDate: '2025-11-14', dependencies: [] }
  ],
  [STORES.TEAM]: [
    { id: 'tm1', companyId: 'c1', name: 'John Anderson', initials: 'JA', role: 'Principal Admin', status: 'On Site', projectId: 'p1', projectName: 'City Centre Plaza', phone: '+44 7700 900001', color: 'bg-[#0f5c82]', email: 'john@buildcorp.com', bio: '20+ years in construction.', location: 'London, UK', skills: ['Strategic Planning', 'Budget Management'], certifications: [], performanceRating: 98, completedProjects: 42 },
    { id: 'tm3', companyId: 'c1', name: 'Mike Thompson', initials: 'MT', role: 'Project Manager', status: 'On Site', projectId: 'p1', projectName: 'City Centre Plaza', phone: '+44 7700 900003', color: 'bg-[#1f7d98]', email: 'mike@buildcorp.com', bio: 'Civil engineer.', location: 'London, UK', skills: ['Civil Engineering', 'Site Safety'], certifications: [], performanceRating: 88, completedProjects: 12 },
    { id: 'tm4', companyId: 'c1', name: 'David Chen', initials: 'DC', role: 'Foreman', status: 'On Site', projectId: 'p3', projectName: 'Highway Bridge Repair', phone: '+44 7700 900004', color: 'bg-[#0f5c82]', email: 'david@buildcorp.com', bio: 'Steel expert.', location: 'Birmingham, UK', skills: ['Concrete', 'Formwork'], certifications: [], performanceRating: 92, completedProjects: 25 },
    { id: 'tm8', companyId: 'c1', name: 'Alice Smith', initials: 'AS', role: 'Site Engineer', status: 'On Site', projectId: 'p1', projectName: 'City Centre Plaza', phone: '+44 7700 900009', color: 'bg-[#0f5c82]', email: 'alice@buildcorp.com', bio: 'Quality control specialist.', location: 'London, UK', skills: ['Quality Control'], certifications: [], performanceRating: 100, completedProjects: 0 }
  ],
  [STORES.DOCUMENTS]: [
    { id: 'd1', name: 'City Centre - Structural Plans', type: 'CAD', projectId: 'p1', projectName: 'City Centre Plaza', size: '12.5 MB', date: '2025-10-15', status: 'Approved', linkedTaskIds: ['t4'] },
    { id: 'd2', name: 'Building Permit - Phase 1', type: 'Document', projectId: 'p1', projectName: 'City Centre Plaza', size: '2.3 MB', date: '2025-09-20', status: 'Approved' },
    { id: 'd3', name: 'Site Progress - North Wing', type: 'Image', projectId: 'p1', projectName: 'City Centre Plaza', size: '1.8 MB', date: '2025-11-01', status: 'Approved', url: 'https://images.unsplash.com/photo-1595849695259-34f50b239d28?auto=format&fit=crop&w=1000&q=80' }
  ],
  [STORES.CLIENTS]: [
    { id: 'c1', companyId: 'c1', name: 'Metro Development Group', contactPerson: 'Alice Walker', role: 'Director of Operations', email: 'alice@metrodev.com', phone: '(555) 123-4567', status: 'Active', tier: 'Gold', activeProjects: 3, totalValue: '£45.2M' }
  ],
  [STORES.INVENTORY]: [
    { id: 'INV-001', companyId: 'c1', name: 'Portland Cement Type I', category: 'Raw Materials', stock: 450, unit: 'Bags', threshold: 100, status: 'In Stock', location: 'Warehouse A', lastOrderDate: '2025-10-20', costPerUnit: 12.50 }
  ],
  [STORES.SAFETY_INCIDENTS]: [
    { id: 'si-1', title: 'Minor cut on hand', project: 'City Centre Plaza', projectId: 'p1', severity: 'Low', status: 'Resolved', date: '2025-11-05', type: 'Injury' },
    { id: 'si-2', title: 'Slip hazard identified', project: 'Residential Complex', projectId: 'p2', severity: 'Medium', status: 'Open', date: '2025-11-10', type: 'Hazard' },
    { id: 'si-3', title: 'Near miss - Crane', project: 'City Centre Plaza', projectId: 'p1', severity: 'High', status: 'Investigating', date: '2025-11-09', type: 'Near Miss' },
    { id: 'si-4', title: 'Scaffold Issue', project: 'Highway Bridge', projectId: 'p3', severity: 'Medium', status: 'Open', date: '2025-11-08', type: 'Compliance' },
  ],
  [STORES.EQUIPMENT]: [
    { id: 'eq1', name: 'Excavator CAT 320', type: 'Heavy Machinery', status: 'In Use', projectId: 'p1', projectName: 'City Centre Plaza', lastService: '2025-10-15', nextService: '2025-12-15', companyId: 'c1' },
    { id: 'eq2', name: 'Concrete Mixer', type: 'Utility Equipment', status: 'Available', projectId: '', projectName: '-', lastService: '2025-09-20', nextService: '2025-11-20', companyId: 'c1' },
    { id: 'eq3', name: 'Tower Crane', type: 'Heavy Machinery', status: 'In Use', projectId: 'p1', projectName: 'City Centre Plaza', lastService: '2025-10-01', nextService: '2025-12-01', companyId: 'c1' },
    { id: 'eq4', name: 'Forklift - 5 Ton', type: 'Heavy Machinery', status: 'Available', projectId: '', projectName: '-', lastService: '2025-10-10', nextService: '2025-12-10', companyId: 'c1' },
    { id: 'eq5', name: 'Scissor Lift', type: 'Access', status: 'In Use', projectId: 'p2', projectName: 'Residential Complex', lastService: '2025-11-01', nextService: '2026-01-01', companyId: 'c1' },
  ],
  [STORES.TIMESHEETS]: [
    { id: 'ts1', employeeName: 'James Wilson', projectId: 'p3', projectName: 'Highway Bridge', date: '2025-11-08', hours: 9, startTime: '08:00', endTime: '17:00', status: 'Pending', companyId: 'c1' },
    { id: 'ts2', employeeName: 'David Chen', projectId: 'p2', projectName: 'Residential Complex', date: '2025-11-08', hours: 9, startTime: '07:30', endTime: '16:30', status: 'Approved', companyId: 'c1' },
    { id: 'ts3', employeeName: 'Robert Garcia', projectId: 'p1', projectName: 'City Centre Plaza', date: '2025-11-08', hours: 10, startTime: '08:00', endTime: '18:00', status: 'Approved', companyId: 'c1' },
    { id: 'ts4', employeeName: 'James Wilson', projectId: 'p3', projectName: 'Highway Bridge', date: '2025-11-09', hours: 8.75, startTime: '08:15', endTime: '17:00', status: 'Pending', companyId: 'c1' },
    { id: 'ts5', employeeName: 'Emma Johnson', projectId: 'p2', projectName: 'Residential Complex', date: '2025-11-09', hours: 9.5, startTime: '08:00', endTime: '17:30', status: 'Pending', companyId: 'c1' },
  ]
};

class DatabaseService {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;

  constructor() {
    this.dbName = DB_NAME;
    this.dbVersion = DB_VERSION;
  }

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.seedData().then(() => resolve(this.db!));
      };

      request.onerror = (event) => {
        reject(`Database error: ${(event.target as IDBOpenDBRequest).error}`);
      };
    });
  }

  private async seedData() {
    if (!this.db) return;
    
    return new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([STORES.PROJECTS], 'readonly');
        const store = transaction.objectStore(STORES.PROJECTS);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                console.log("Seeding initial database...");
                try {
                    const seedTransaction = this.db!.transaction(Object.values(STORES), 'readwrite');
                    
                    seedTransaction.oncomplete = () => {
                        console.log("Database seeding complete.");
                        resolve();
                    };
                    
                    seedTransaction.onerror = (e) => {
                        console.warn("Database seeding warning:", (e.target as IDBRequest).error);
                        resolve();
                    };

                    Object.entries(SEED_DATA).forEach(([storeName, items]) => {
                        const objectStore = seedTransaction.objectStore(storeName);
                        items.forEach(item => objectStore.put(item));
                    });
                } catch (error) {
                    console.error("Transaction creation failed", error);
                    resolve();
                }
            } else {
                resolve();
            }
        };
        
        countRequest.onerror = (e) => {
            console.warn("Failed to check DB count, skipping seed", (e.target as IDBRequest).error);
            resolve();
        };
    });
  }

  // Generic CRUD Operations

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Failed to get all from ${storeName}`, e);
      return [];
    }
  }

  async add<T>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item); // Use put for upsert capability

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Failed to add to ${storeName}`, e);
    }
  }

  async update<T>(storeName: string, item: T): Promise<void> {
    return this.add(storeName, item); // .put handles update as well
  }

  async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Failed to delete from ${storeName}`, e);
    }
  }

  // Specific Accessors
  async getProjects(): Promise<Project[]> { return this.getAll<Project>(STORES.PROJECTS); }
  async addProject(p: Project) { return this.add(STORES.PROJECTS, p); }
  async updateProject(id: string, p: Partial<Project>) {
      const projects = await this.getProjects();
      const existing = projects.find(x => x.id === id);
      if(existing) await this.update(STORES.PROJECTS, { ...existing, ...p });
  }
  async deleteProject(id: string) { return this.delete(STORES.PROJECTS, id); }

  async getTasks(): Promise<Task[]> { return this.getAll<Task>(STORES.TASKS); }
  async addTask(t: Task) { return this.add(STORES.TASKS, t); }
  async updateTask(id: string, t: Partial<Task>) {
      const tasks = await this.getTasks();
      const existing = tasks.find(x => x.id === id);
      if(existing) await this.update(STORES.TASKS, { ...existing, ...t });
  }

  async getTeam(): Promise<TeamMember[]> { return this.getAll<TeamMember>(STORES.TEAM); }
  async addTeamMember(m: TeamMember) { return this.add(STORES.TEAM, m); }

  async getDocuments(): Promise<ProjectDocument[]> { return this.getAll<ProjectDocument>(STORES.DOCUMENTS); }
  async addDocument(d: ProjectDocument) { return this.add(STORES.DOCUMENTS, d); }
  async updateDocument(id: string, d: Partial<ProjectDocument>) {
      const docs = await this.getDocuments();
      const existing = docs.find(x => x.id === id);
      if (existing) await this.update(STORES.DOCUMENTS, { ...existing, ...d });
  }

  async getClients(): Promise<Client[]> { return this.getAll<Client>(STORES.CLIENTS); }
  async addClient(c: Client) { return this.add(STORES.CLIENTS, c); }

  async getInventory(): Promise<InventoryItem[]> { return this.getAll<InventoryItem>(STORES.INVENTORY); }
  async addInventoryItem(i: InventoryItem) { return this.add(STORES.INVENTORY, i); }
  async updateInventoryItem(id: string, i: Partial<InventoryItem>) {
      const items = await this.getInventory();
      const existing = items.find(x => x.id === id);
      if(existing) await this.update(STORES.INVENTORY, { ...existing, ...i });
  }

  async getRFIs(): Promise<RFI[]> { return this.getAll<RFI>(STORES.RFIS); }
  async addRFI(item: RFI) { return this.add(STORES.RFIS, item); }

  async getPunchItems(): Promise<PunchItem[]> { return this.getAll<PunchItem>(STORES.PUNCH_ITEMS); }
  async addPunchItem(item: PunchItem) { return this.add(STORES.PUNCH_ITEMS, item); }

  async getDailyLogs(): Promise<DailyLog[]> { return this.getAll<DailyLog>(STORES.DAILY_LOGS); }
  async addDailyLog(item: DailyLog) { return this.add(STORES.DAILY_LOGS, item); }

  async getDayworks(): Promise<Daywork[]> { return this.getAll<Daywork>(STORES.DAYWORKS); }
  async addDaywork(item: Daywork) { return this.add(STORES.DAYWORKS, item); }

  // New Methods for Safety, Equipment, Timesheets
  async getSafetyIncidents(): Promise<SafetyIncident[]> { return this.getAll<SafetyIncident>(STORES.SAFETY_INCIDENTS); }
  async addSafetyIncident(item: SafetyIncident) { return this.add(STORES.SAFETY_INCIDENTS, item); }
  async updateSafetyIncident(id: string, u: Partial<SafetyIncident>) {
      const items = await this.getSafetyIncidents();
      const existing = items.find(x => x.id === id);
      if(existing) await this.update(STORES.SAFETY_INCIDENTS, { ...existing, ...u });
  }

  async getEquipment(): Promise<Equipment[]> { return this.getAll<Equipment>(STORES.EQUIPMENT); }
  async addEquipment(item: Equipment) { return this.add(STORES.EQUIPMENT, item); }
  async updateEquipment(id: string, u: Partial<Equipment>) {
      const items = await this.getEquipment();
      const existing = items.find(x => x.id === id);
      if(existing) await this.update(STORES.EQUIPMENT, { ...existing, ...u });
  }

  async getTimesheets(): Promise<Timesheet[]> { return this.getAll<Timesheet>(STORES.TIMESHEETS); }
  async addTimesheet(item: Timesheet) { return this.add(STORES.TIMESHEETS, item); }
  async updateTimesheet(id: string, u: Partial<Timesheet>) {
      const items = await this.getTimesheets();
      const existing = items.find(x => x.id === id);
      if(existing) await this.update(STORES.TIMESHEETS, { ...existing, ...u });
  }
}

export const db = new DatabaseService();
