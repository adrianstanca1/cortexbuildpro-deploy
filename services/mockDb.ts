
import { Project, Task, TeamMember, ProjectDocument, Client, InventoryItem, RFI, PunchItem, DailyLog, Daywork } from '../types';

// --- Initial Data Seeds (Moved from ProjectContext) ---

const initialProjects: Project[] = [
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
    aiAnalysis: 'Project is progressing ahead of schedule. Structural steel completion is imminent.',
    latitude: 40.7128,
    longitude: -74.0060,
    phases: [
      { id: 'ph1-1', name: 'Site Preparation', startDate: '2025-01-15', endDate: '2025-02-15', status: 'Complete', progress: 100 },
      { id: 'ph1-2', name: 'Foundation', startDate: '2025-02-16', endDate: '2025-05-15', status: 'Complete', progress: 100 },
      { id: 'ph1-3', name: 'Structural Steel', startDate: '2025-05-16', endDate: '2025-11-30', status: 'In Progress', progress: 65 },
      { id: 'ph1-4', name: 'Enclosure', startDate: '2025-12-01', endDate: '2026-06-15', status: 'Upcoming', progress: 0 }
    ]
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
    weatherLocation: { city: 'Chicago', temp: '65°', condition: 'Windy' },
    latitude: 41.8781,
    longitude: -87.6298,
    phases: [
      { id: 'ph2-1', name: 'Groundworks', startDate: '2025-02-01', endDate: '2025-03-30', status: 'Complete', progress: 100 },
      { id: 'ph2-2', name: 'Tower Foundations', startDate: '2025-04-01', endDate: '2025-06-30', status: 'Complete', progress: 100 },
      { id: 'ph2-3', name: 'Superstructure', startDate: '2025-07-01', endDate: '2025-10-15', status: 'Delayed', progress: 42 },
      { id: 'ph2-4', name: 'Interior Fit-out', startDate: '2025-10-16', endDate: '2025-11-30', status: 'Upcoming', progress: 0 }
    ]
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
    weatherLocation: { city: 'Austin', temp: '88°', condition: 'Clear' },
    latitude: 30.2672,
    longitude: -97.7431,
    phases: [
      { id: 'ph3-1', name: 'Traffic Management', startDate: '2025-10-01', endDate: '2025-10-07', status: 'Complete', progress: 100 },
      { id: 'ph3-2', name: 'Demolition', startDate: '2025-10-08', endDate: '2025-11-15', status: 'In Progress', progress: 28 },
      { id: 'ph3-3', name: 'Reinforcement', startDate: '2025-11-16', endDate: '2026-02-28', status: 'Upcoming', progress: 0 }
    ]
  },
  {
    id: 'p4',
    companyId: 'c1',
    name: 'Eco-Friendly Office Park',
    code: 'ECO-OP-01',
    description: 'Net-zero energy office park with solar integration and rainwater harvesting.',
    location: 'North Hills',
    type: 'Commercial',
    status: 'Planning',
    health: 'Good',
    progress: 0,
    budget: 5000000,
    spent: 125000,
    startDate: '2025-12-01',
    endDate: '2027-06-01',
    manager: 'John Anderson',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    teamSize: 8,
    tasks: { total: 0, completed: 0, overdue: 0 },
    weatherLocation: { city: 'Seattle', temp: '55°', condition: 'Rain' },
    latitude: 47.6062,
    longitude: -122.3321,
    phases: [
      { id: 'ph4-1', name: 'Permitting', startDate: '2025-12-01', endDate: '2026-03-31', status: 'Upcoming', progress: 10 },
      { id: 'ph4-2', name: 'Site Clearing', startDate: '2026-04-01', endDate: '2026-05-31', status: 'Upcoming', progress: 0 }
    ]
  }
];

const initialTasks: Task[] = [
    { 
        id: 't1', 
        companyId: 'c1', 
        title: 'Safety inspection - Site A', 
        description: 'Conduct full perimeter safety check including scaffolding tags and fall protection systems before concrete pour.', 
        projectId: 'p1', 
        status: 'To Do', 
        priority: 'High', 
        assigneeName: 'Mike T.', 
        assigneeType: 'user', 
        dueDate: '2025-11-12', 
        progress: 0,
        subtasks: [
            { id: 'st1-1', title: 'Perimeter fence check', completed: false },
            { id: 'st1-2', title: 'Scaffolding tag verification', completed: false },
            { id: 'st1-3', title: 'Fall protection anchor testing', completed: false }
        ],
        latitude: 40.7128, 
        longitude: -74.0060 
    },
    { id: 't2', companyId: 'c1', title: 'Concrete pouring - Level 2', description: 'Pour and finish slab for level 2 podium. Requires pump truck coordination.', projectId: 'p1', status: 'Blocked', priority: 'Critical', assigneeName: 'All Operatives', assigneeType: 'role', dueDate: '2025-11-20', progress: 0, dependencies: ['t1', 't3'], latitude: 40.7135, longitude: -74.0135 },
    { 
        id: 't3', 
        companyId: 'c1', 
        title: 'Complete foundation excavation', 
        description: 'Finalize earthworks for the North wing foundation footings.', 
        projectId: 'p1', 
        status: 'In Progress', 
        priority: 'High', 
        assigneeName: 'David Chen', 
        assigneeType: 'user', 
        dueDate: '2025-11-15',
        progress: 33,
        subtasks: [
            { id: 'st3-1', title: 'Excavation of Sector A', completed: true },
            { id: 'st3-2', title: 'Removal of spoil material', completed: false },
            { id: 'st3-3', title: 'Footing stakeout', completed: false }
        ]
    },
    { id: 't4', companyId: 'c1', title: 'Install steel framework', description: 'Erect primary steel columns for sectors 1-4.', projectId: 'p1', status: 'Done', priority: 'High', assigneeName: 'David Chen', assigneeType: 'user', dueDate: '2025-11-08', progress: 100 },
    { id: 't5', companyId: 'c1', title: 'Quality control inspection', description: 'Verify rebar spacing and cover depth prior to pour.', projectId: 'p3', status: 'To Do', priority: 'High', assigneeName: 'John Anderson', assigneeType: 'user', dueDate: '2025-11-14', progress: 0 },
    { id: 't6', companyId: 'c1', title: 'Install electrical conduits', projectId: 'p3', status: 'In Progress', priority: 'Medium', assigneeName: 'James W.', assigneeType: 'user', dueDate: '2025-11-18', progress: 50 },
    { id: 't7', companyId: 'c1', title: 'Plumbing rough-in', projectId: 'p2', status: 'To Do', priority: 'Medium', assigneeName: 'Emma J.', assigneeType: 'user', dueDate: '2025-11-22', progress: 0 },
    { id: 't8', companyId: 'c1', title: 'HVAC system installation', projectId: 'p2', status: 'In Progress', priority: 'Medium', assigneeName: 'Emma J.', assigneeType: 'user', dueDate: '2025-11-25', progress: 25 },
    { id: 't9', companyId: 'c1', title: 'Prepare material estimates', projectId: 'p2', status: 'Done', priority: 'Medium', assigneeName: 'Sarah M.', assigneeType: 'user', dueDate: '2025-11-10', progress: 100 },
    { id: 't10', companyId: 'c1', title: 'Landscaping preparation', projectId: 'p4', status: 'In Progress', priority: 'Low', assigneeName: 'Sam B.', assigneeType: 'user', dueDate: '2025-11-30', progress: 10 },
];

const initialRFIs: RFI[] = [
    { id: 'rfi-1', companyId: 'c1', projectId: 'p1', number: 'RFI-001', subject: 'Clarification on Curtain Wall Anchors', question: 'The specs for anchors on level 4 seem to conflict with structural drawings.', assignedTo: 'Sarah Mitchell', status: 'Open', dueDate: '2025-11-15', createdAt: '2025-11-08' },
    { id: 'rfi-2', companyId: 'c1', projectId: 'p1', number: 'RFI-002', subject: 'Lobby Flooring Material', question: 'Is the marble finish confirmed for the main entrance?', answer: 'Yes, specs confirmed in Rev 3.', assignedTo: 'John Anderson', status: 'Closed', dueDate: '2025-10-30', createdAt: '2025-10-25' },
];

const initialPunchList: PunchItem[] = [
    { id: 'pi-1', companyId: 'c1', projectId: 'p1', title: 'Paint scratch in hallway', location: 'Level 3, Corridor B', description: 'Minor scuff marks on north wall.', status: 'Open', priority: 'Low', assignedTo: 'David Chen', createdAt: '2025-11-09' },
    { id: 'pi-2', companyId: 'c1', projectId: 'p1', title: 'Loose electrical socket', location: 'Unit 402', description: 'Socket not flush with wall.', status: 'Resolved', priority: 'Medium', assignedTo: 'Robert Garcia', createdAt: '2025-11-05' },
];

const initialDailyLogs: DailyLog[] = [
    { id: 'dl-1', companyId: 'c1', projectId: 'p1', date: '2025-11-10', weather: 'Sunny, 72°F', notes: 'Site visit by inspectors went well.', workPerformed: 'Concrete pouring on sector 4 completed.', crewCount: 18, author: 'Mike Thompson', createdAt: '2025-11-10' },
    { id: 'dl-2', companyId: 'c1', projectId: 'p1', date: '2025-11-09', weather: 'Cloudy, 68°F', notes: 'Delay in steel delivery caused 2h downtime.', workPerformed: 'Formwork setup for Level 5.', crewCount: 22, author: 'Mike Thompson', createdAt: '2025-11-09' },
];

const initialDayworks: Daywork[] = [
    { 
        id: 'dw-1', companyId: 'c1', projectId: 'p1', date: '2025-11-08', description: 'Emergency cleanup after storm. Removed debris from north access road to allow delivery trucks.', status: 'Approved', createdAt: '2025-11-08',
        labor: [{ name: 'Adrian', trade: 'Laborer', hours: 12, rate: 30 }],
        materials: [{ item: 'Sandbags', quantity: 50, unit: 'bags', cost: 5.50 }],
        attachments: [],
        totalLaborCost: 360,
        totalMaterialCost: 275,
        grandTotal: 635
    },
    { 
        id: 'dw-2', companyId: 'c1', projectId: 'p1', date: '2025-11-10', description: 'Extra excavation for utility line reroute due to unforeseen obstruction.', status: 'Pending', createdAt: '2025-11-10',
        labor: [{ name: 'Team A', trade: 'Groundworks', hours: 8, rate: 45 }],
        materials: [{ item: 'Gravel', quantity: 2, unit: 'ton', cost: 80 }],
        attachments: [],
        totalLaborCost: 360,
        totalMaterialCost: 160,
        grandTotal: 520
    },
];

const DB_KEYS = {
  PROJECTS: 'buildpro_projects',
  TASKS: 'buildpro_tasks',
  TEAM: 'buildpro_team',
  DOCS: 'buildpro_docs',
  CLIENTS: 'buildpro_clients',
  INVENTORY: 'buildpro_inventory',
  RFIS: 'buildpro_rfis',
  PUNCH_LIST: 'buildpro_punch_list',
  DAILY_LOGS: 'buildpro_daily_logs',
  DAYWORKS: 'buildpro_dayworks',
};

// Helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDatabase {
  constructor() {
    this.init();
  }

  private init() {
    // Seed if empty
    if (!localStorage.getItem(DB_KEYS.RFIS)) localStorage.setItem(DB_KEYS.RFIS, JSON.stringify(initialRFIs));
    if (!localStorage.getItem(DB_KEYS.PUNCH_LIST)) localStorage.setItem(DB_KEYS.PUNCH_LIST, JSON.stringify(initialPunchList));
    if (!localStorage.getItem(DB_KEYS.DAILY_LOGS)) localStorage.setItem(DB_KEYS.DAILY_LOGS, JSON.stringify(initialDailyLogs));
    if (!localStorage.getItem(DB_KEYS.DAYWORKS)) localStorage.setItem(DB_KEYS.DAYWORKS, JSON.stringify(initialDayworks));
    
    // Ensure basics exist (simplified check)
    if (!localStorage.getItem(DB_KEYS.PROJECTS)) localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(initialProjects));
    if (!localStorage.getItem(DB_KEYS.TASKS)) localStorage.setItem(DB_KEYS.TASKS, JSON.stringify(initialTasks));
  }

  private getItems<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setItems<T>(key: string, items: T[]) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    await delay(300);
    return this.getItems<Project>(DB_KEYS.PROJECTS);
  }

  async addProject(project: Project): Promise<void> {
    await delay(300);
    const items = this.getItems<Project>(DB_KEYS.PROJECTS);
    this.setItems(DB_KEYS.PROJECTS, [project, ...items]);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await delay(200);
    const items = this.getItems<Project>(DB_KEYS.PROJECTS);
    this.setItems(DB_KEYS.PROJECTS, items.map(i => i.id === id ? { ...i, ...updates } : i));
  }

  async deleteProject(id: string): Promise<void> {
    await delay(200);
    const items = this.getItems<Project>(DB_KEYS.PROJECTS);
    this.setItems(DB_KEYS.PROJECTS, items.filter(i => i.id !== id));
  }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    await delay(200);
    return this.getItems<Task>(DB_KEYS.TASKS);
  }

  async addTask(task: Task): Promise<void> {
    await delay(200);
    const items = this.getItems<Task>(DB_KEYS.TASKS);
    this.setItems(DB_KEYS.TASKS, [task, ...items]);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await delay(100);
    const items = this.getItems<Task>(DB_KEYS.TASKS);
    this.setItems(DB_KEYS.TASKS, items.map(i => i.id === id ? { ...i, ...updates } : i));
  }

  // --- Team ---
  async getTeam(): Promise<TeamMember[]> {
    await delay(200);
    // Return empty if not seeded in this file context for brevity, assuming it exists from prev context
    const data = localStorage.getItem(DB_KEYS.TEAM);
    return data ? JSON.parse(data) : [];
  }

  async addTeamMember(member: TeamMember): Promise<void> {
    await delay(200);
    const items = this.getItems<TeamMember>(DB_KEYS.TEAM);
    this.setItems(DB_KEYS.TEAM, [member, ...items]);
  }

  // --- Docs ---
  async getDocuments(): Promise<ProjectDocument[]> {
    await delay(200);
    const data = localStorage.getItem(DB_KEYS.DOCS);
    return data ? JSON.parse(data) : [
        { id: 'd1', name: 'City Centre - Structural Plans', type: 'CAD', projectId: 'p1', projectName: 'City Centre Plaza', size: '12.5 MB', date: '2025-10-15', status: 'Approved', linkedTaskIds: ['t4'] },
        { id: 'd2', name: 'Building Permit - Phase 1', type: 'Document', projectId: 'p1', projectName: 'City Centre Plaza', size: '2.3 MB', date: '2025-09-20', status: 'Approved', linkedTaskIds: [] }
    ];
  }

  async addDocument(doc: ProjectDocument): Promise<void> {
    await delay(200);
    const items = this.getItems<ProjectDocument>(DB_KEYS.DOCS);
    this.setItems(DB_KEYS.DOCS, [doc, ...items]);
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    await delay(200);
    const data = localStorage.getItem(DB_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  }

  async addClient(client: Client): Promise<void> {
    await delay(200);
    const items = this.getItems<Client>(DB_KEYS.CLIENTS);
    this.setItems(DB_KEYS.CLIENTS, [client, ...items]);
  }

  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> {
    await delay(200);
    const data = localStorage.getItem(DB_KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  }

  async addInventoryItem(item: InventoryItem): Promise<void> {
    await delay(200);
    const items = this.getItems<InventoryItem>(DB_KEYS.INVENTORY);
    this.setItems(DB_KEYS.INVENTORY, [item, ...items]);
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    await delay(100);
    const items = this.getItems<InventoryItem>(DB_KEYS.INVENTORY);
    this.setItems(DB_KEYS.INVENTORY, items.map(i => i.id === id ? { ...i, ...updates } : i));
  }
  
  // --- New Entities ---
  async getRFIs(): Promise<RFI[]> {
      await delay(200);
      return this.getItems(DB_KEYS.RFIS);
  }
  async addRFI(item: RFI) {
      await delay(200);
      const items = this.getItems<RFI>(DB_KEYS.RFIS);
      this.setItems(DB_KEYS.RFIS, [item, ...items]);
  }
  async updateRFI(id: string, updates: Partial<RFI>) {
      await delay(200);
      const items = this.getItems<RFI>(DB_KEYS.RFIS);
      this.setItems(DB_KEYS.RFIS, items.map(i => i.id === id ? { ...i, ...updates } : i));
  }

  async getPunchItems(): Promise<PunchItem[]> { return this.getAll<PunchItem>(DB_KEYS.PUNCH_LIST); }
  async addPunchItem(item: PunchItem) { return this.add(DB_KEYS.PUNCH_LIST, item); }

  async getDailyLogs(): Promise<DailyLog[]> { return this.getAll<DailyLog>(DB_KEYS.DAILY_LOGS); }
  async addDailyLog(item: DailyLog) { return this.add(DB_KEYS.DAILY_LOGS, item); }

  async getDayworks(): Promise<Daywork[]> { return this.getAll<Daywork>(DB_KEYS.DAYWORKS); }
  async addDaywork(item: Daywork) { return this.add(DB_KEYS.DAYWORKS, item); }

  // Generic Helpers for internal use
  async getAll<T>(key: string): Promise<T[]> {
      await delay(200);
      return this.getItems<T>(key);
  }
  async add<T>(key: string, item: T): Promise<void> {
      await delay(200);
      const items = this.getItems<T>(key);
      this.setItems(key, [item, ...items]);
  }
}

export const db = new MockDatabase();
