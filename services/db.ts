import { 
  Project, Task, TeamMember, ProjectDocument, ProjectDrawing, 
  SitePhoto, Client, InventoryItem, RFI, PunchItem, DailyLog, 
  Daywork, SafetyIncident, Equipment, Timesheet, Invoice, 
  Company, AuditLog, SystemConfig, UserProfile, UserStatus, Invitation, ChangeOrder, UserRole
} from '../types';

const DB_NAME = 'CortexBuildProOS_v3';
const DB_VERSION = 2;
const STORES = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TEAM: 'team',
  DOCUMENTS: 'documents', 
  DRAWINGS: 'drawings',   
  PHOTOS: 'photos',       
  CLIENTS: 'clients',
  INVENTORY: 'inventory',
  RFIS: 'rfis',
  CHANGE_ORDERS: 'change_orders',
  PUNCH_ITEMS: 'punch_items',
  DAILY_LOGS: 'daily_logs',
  DAYWORKS: 'dayworks',
  SAFETY_INCIDENTS: 'safety_incidents',
  EQUIPMENT: 'equipment',
  TIMESHEETS: 'timesheets',
  INVOICES: 'invoices',
  COMPANIES: 'companies',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_CONFIG: 'system_config',
  USERS: 'users',
  INVITATIONS: 'invitations'
};

const SYNC_CHANNEL = new BroadcastChannel('cortex_realtime_sync');

class DatabaseService {
  private db: IDBDatabase | null = null;
  private openingPromise: Promise<IDBDatabase> | null = null;

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.openingPromise) return this.openingPromise;

    this.openingPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        Object.values(STORES).forEach(storeName => {
          let store;
          if (!db.objectStoreNames.contains(storeName)) {
            store = db.createObjectStore(storeName, { keyPath: 'id' });
          } else {
            store = request.transaction!.objectStore(storeName);
          }

          // Indexing strategy for multi-tenant isolation
          if (!['system_config', 'companies', 'users', 'invitations'].includes(storeName)) {
            if (!store.indexNames.contains('by_company')) {
              store.createIndex('by_company', 'companyId', { unique: false });
            }
          }
          if (storeName === STORES.USERS) {
            if (!store.indexNames.contains('by_email')) {
              store.createIndex('by_email', 'email', { unique: true });
            }
          }
          if (storeName === STORES.INVITATIONS) {
            if (!store.indexNames.contains('by_token')) {
              store.createIndex('by_token', 'token', { unique: true });
            }
          }
        });
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        try {
          await this.seedInitialData();
          resolve(this.db!);
        } catch (error) {
          console.error("[PROTOCOL] Genesis critical failure:", error);
          reject(error);
        }
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.openingPromise;
  }

  private async seedInitialData() {
    const users = await this.getAllUsers();
    if (users.length === 0) {
      console.log("[PROTOCOL] Initializing Sovereign Registry...");
      
      const cid = 'c-genesis-01';

      // 1. System Config Shard
      await this.updateSystemConfig({
        id: 'global-config',
        maintenanceMode: false,
        allowNewRegistrations: true,
        globalSessionTTL: 240,
        enforceMFAAcrossPlatform: true,
        aiTokenLimitPerTenant: 10000000,
        version: 'v4.5.3-STABLE',
        globalFeatureFlags: { 'ai_reasoning_v3': true, 'multimodal_search': true, 'realtime_telemetry': true }
      });

      // 2. Default Company Shard
      const defaultCompany: Company = {
        id: cid,
        name: 'Nexus Infrastructure Group',
        slug: 'nexus-infra',
        status: 'ACTIVE',
        deploymentState: 'ACTIVE',
        industry: 'Infrastructure',
        region: 'EMEA',
        timezone: 'UTC',
        currency: 'GBP',
        plan: 'Enterprise',
        limits: { userSeats: 500, projects: 100, storageGB: 1000, apiCallsPerMonth: 1000000 },
        features: { 
          aiAssistant: true, 
          imagineStudio: true, 
          financials: true, 
          advancedRBAC: true, 
          liveVision: true, 
          bimAnalytics: true 
        },
        securityProfile: { ssoEnabled: true, mfaRequired: true, sessionTTL: 240, passwordPolicy: 'Strong' },
        ownerId: 'u-owner-01',
        ownerEmail: 'owner@nexus.io',
        ownerName: 'James Sterling',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        usersCount: 5,
        projectsCount: 2,
        projectProgress: 35
      };
      await this.addCompany(defaultCompany);

      // 3. User Identity Shards
      const identities: UserProfile[] = [
        {
          id: 'u-admin-01',
          name: 'Sovereign Administrator',
          email: 'admin@cortex.pro'.toLowerCase(),
          role: UserRole.SUPER_ADMIN,
          status: 'ACTIVE',
          phone: '+44 000 000 000',
          companyId: 'PLATFORM',
          projectIds: ['ALL'],
          avatarInitials: 'SA',
          features: defaultCompany.features,
          createdAt: new Date().toISOString()
        },
        {
          id: 'u-owner-01',
          name: 'James Sterling',
          email: 'owner@nexus.io'.toLowerCase(),
          role: UserRole.COMPANY_OWNER,
          status: 'ACTIVE',
          phone: '+44 111 222 333',
          companyId: cid,
          projectIds: ['p-01', 'p-02'],
          avatarInitials: 'JS',
          features: defaultCompany.features,
          createdAt: new Date().toISOString()
        }
      ];
      for (const u of identities) await this.saveUser(u);

      // 4. Operational Shards (Projects, Tasks, RFIs, etc.)
      const p1: Project = {
        id: 'p-01',
        companyId: cid,
        name: 'Horizon Tower B',
        code: 'HTB-25',
        description: 'Primary structural assembly and facade integration for residential sector B.',
        location: 'London Docklands',
        type: 'Residential',
        status: 'Active',
        health: 'Good',
        progress: 45,
        budget: 45000000,
        spent: 12000000,
        startDate: '2025-01-01',
        endDate: '2026-06-30',
        manager: 'James Sterling',
        image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=80',
        teamSize: 24,
        tasks: { total: 42, completed: 18, overdue: 0 },
        latitude: 51.5033,
        longitude: -0.0055,
        phases: [
          { id: 'ph-1', name: 'Substructure', startDate: '2025-01-01', endDate: '2025-04-30', status: 'Complete', progress: 100 },
          { id: 'ph-2', name: 'Superstructure', startDate: '2025-05-01', endDate: '2025-12-31', status: 'In Progress', progress: 35 }
        ]
      };
      await this.addProject(p1);

      const tasks: Task[] = [
        {
          id: 't-01',
          companyId: cid,
          projectId: 'p-01',
          title: 'Concrete Pour Sector 4',
          description: 'Technical pour for level 12 structural slab.',
          status: 'In Progress',
          priority: 'High',
          assigneeName: 'James Sterling',
          assigneeType: 'user',
          dueDate: '2025-11-20',
          latitude: 51.5034,
          longitude: -0.0056
        }
      ];
      for (const t of tasks) await this.addTask(t);

      const rfi: RFI = {
        id: 'rfi-01',
        companyId: cid,
        projectId: 'p-01',
        number: 'RFI-101',
        subject: 'Facade Anchor Tolerance',
        question: 'Verification required for anchor point load tolerance on grid line C-12.',
        status: 'Open',
        assignedTo: 'James Sterling',
        dueDate: '2025-11-25',
        createdAt: new Date().toISOString()
      };
      await this.addRFI(rfi);

      console.log("[PROTOCOL] Genesis complete. admin@cortex.pro / owner@nexus.io authorized.");
    }
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction([storeName], mode).objectStore(storeName);
  }

  async getAll<T>(storeName: string, companyId?: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      if (companyId && companyId !== 'ALL' && store.indexNames.contains('by_company')) {
        const index = store.index('by_company');
        request = index.getAll(IDBKeyRange.only(companyId));
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result as T[];
        if (companyId && companyId !== 'ALL') {
          results = results.filter((item: any) => {
            if (storeName === STORES.COMPANIES) return item.id === companyId;
            if (storeName === STORES.AUDIT_LOGS) return item.tenantId === companyId;
            return item.companyId === companyId;
          });
        }
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getByUserEmail(email: string): Promise<UserProfile | null> {
    const store = await this.getStore(STORES.USERS);
    const index = store.index('by_email');
    return new Promise((resolve, reject) => {
      const request = index.get(email.toLowerCase());
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T extends { id: string; companyId?: string }>(storeName: string, item: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => {
        SYNC_CHANNEL.postMessage({ type: 'UPDATE', store: storeName, companyId: item.companyId, id: item.id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async update<T extends { id: string; companyId?: string }>(storeName: string, id: string, updates: Partial<T>): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (!data) {
          reject(new Error(`Node ${id} not found in shard ${storeName}`));
          return;
        }
        const updatedItem = { ...data, ...updates };
        const putRequest = store.put(updatedItem);
        putRequest.onsuccess = () => {
          SYNC_CHANNEL.postMessage({ type: 'UPDATE', store: storeName, companyId: updatedItem.companyId, id });
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async delete(storeName: string, id: string, companyId?: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        SYNC_CHANNEL.postMessage({ type: 'DELETE', store: storeName, companyId, id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  subscribe(callback: (msg: any) => void) {
    SYNC_CHANNEL.onmessage = (event) => callback(event.data);
  }

  async saveUser(user: UserProfile) { return this.add(STORES.USERS, user); }
  async getUser(id: string) { return this.getById<UserProfile>(STORES.USERS, id); }
  async getAllUsers() { return this.getAll<UserProfile>(STORES.USERS); }
  async updateUserStatus(id: string, status: UserStatus) { return this.update<UserProfile>(STORES.USERS, id, { status }); }
  async addInvitation(inv: Invitation) { return this.add(STORES.INVITATIONS, inv); }
  async getInvitations() { return this.getAll<Invitation>(STORES.INVITATIONS); }
  async getCompanies(): Promise<Company[]> { return this.getAll<Company>(STORES.COMPANIES); }
  async addCompany(c: Company) { return this.add(STORES.COMPANIES, c); }
  async updateCompany(id: string, updates: Partial<Company>) { return this.update(STORES.COMPANIES, id, updates); }
  async getSystemConfig(): Promise<SystemConfig | null> {
    const configs = await this.getAll<SystemConfig>(STORES.SYSTEM_CONFIG);
    return configs[0] || null;
  }
  async updateSystemConfig(config: SystemConfig) { return this.add(STORES.SYSTEM_CONFIG, config); }
  async getAuditLogs(): Promise<AuditLog[]> { return this.getAll<AuditLog>(STORES.AUDIT_LOGS); }
  async addAuditLog(log: AuditLog) { return this.add(STORES.AUDIT_LOGS, log); }
  async getProjects(cid?: string): Promise<Project[]> { return this.getAll<Project>(STORES.PROJECTS, cid); }
  async addProject(p: Project) { return this.add(STORES.PROJECTS, p); }
  async updateProject(id: string, updates: Partial<Project>) { return this.update(STORES.PROJECTS, id, updates); }
  async deleteProject(id: string) { return this.delete(STORES.PROJECTS, id); }
  async getTasks(cid?: string): Promise<Task[]> { return this.getAll<Task>(STORES.TASKS, cid); }
  async addTask(t: Task) { return this.add(STORES.TASKS, t); }
  async updateTask(id: string, updates: Partial<Task>) { return this.update(STORES.TASKS, id, updates); }
  async getTeam(cid?: string): Promise<TeamMember[]> { return this.getAll<TeamMember>(STORES.TEAM, cid); }
  async addTeamMember(m: TeamMember) { return this.add(STORES.TEAM, m); }
  async getDocuments(cid?: string): Promise<ProjectDocument[]> { return this.getAll<ProjectDocument>(STORES.DOCUMENTS, cid); }
  async addDocument(d: ProjectDocument) { return this.add(STORES.DOCUMENTS, d); }
  async updateDocument(id: string, updates: Partial<ProjectDocument>) { return this.update(STORES.DOCUMENTS, id, updates); }
  async getDrawings(cid?: string): Promise<ProjectDrawing[]> { return this.getAll<ProjectDrawing>(STORES.DRAWINGS, cid); }
  async addDrawing(d: ProjectDrawing) { return this.add(STORES.DRAWINGS, d); }
  async updateDrawing(id: string, updates: Partial<ProjectDrawing>) { return this.update(STORES.DRAWINGS, id, updates); }
  async getPhotos(cid?: string): Promise<SitePhoto[]> { return this.getAll<SitePhoto>(STORES.PHOTOS, cid); }
  async addPhoto(p: SitePhoto) { return this.add(STORES.PHOTOS, p); }
  async getClients(cid?: string): Promise<Client[]> { return this.getAll<Client>(STORES.CLIENTS, cid); }
  async addClient(c: Client) { return this.add(STORES.CLIENTS, c); }
  async getRFIs(cid?: string): Promise<RFI[]> { return this.getAll<RFI>(STORES.RFIS, cid); }
  async addRFI(r: RFI) { return this.add(STORES.RFIS, r); }
  async updateRFI(id: string, updates: Partial<RFI>) { return this.update(STORES.RFIS, id, updates); }
  async getChangeOrders(cid?: string): Promise<ChangeOrder[]> { return this.getAll<ChangeOrder>(STORES.CHANGE_ORDERS, cid); }
  async addChangeOrder(co: ChangeOrder) { return this.add(STORES.CHANGE_ORDERS, co); }
  async updateChangeOrder(id: string, updates: Partial<ChangeOrder>) { return this.update(STORES.CHANGE_ORDERS, id, updates); }
  async getPunchItems(cid?: string): Promise<PunchItem[]> { return this.getAll<PunchItem>(STORES.PUNCH_ITEMS, cid); }
  async addPunchItem(pi: PunchItem) { return this.add(STORES.PUNCH_ITEMS, pi); }
  async updatePunchItem(id: string, updates: Partial<PunchItem>) { return this.update(STORES.PUNCH_ITEMS, id, updates); }
  async getDailyLogs(cid?: string): Promise<DailyLog[]> { return this.getAll<DailyLog>(STORES.DAILY_LOGS, cid); }
  async addDailyLog(dl: DailyLog) { return this.add(STORES.DAILY_LOGS, dl); }
  async getDayworks(cid?: string): Promise<Daywork[]> { return this.getAll<Daywork>(STORES.DAYWORKS, cid); }
  async addDaywork(dw: Daywork) { return this.add(STORES.DAYWORKS, dw); }
  async getSafetyIncidents(cid?: string): Promise<SafetyIncident[]> { return this.getAll<SafetyIncident>(STORES.SAFETY_INCIDENTS, cid); }
  async addSafetyIncident(s: SafetyIncident) { return this.add(STORES.SAFETY_INCIDENTS, s); }
  async updateSafetyIncident(id: string, updates: Partial<SafetyIncident>) { return this.update(STORES.SAFETY_INCIDENTS, id, updates); }
  async getEquipment(cid?: string): Promise<Equipment[]> { return this.getAll<Equipment>(STORES.EQUIPMENT, cid); }
  async addEquipment(e: Equipment) { return this.add(STORES.EQUIPMENT, e); }
  async updateEquipment(id: string, updates: Partial<Equipment>) { return this.update(STORES.EQUIPMENT, id, updates); }
  async getInventory(cid?: string): Promise<InventoryItem[]> { return this.getAll<InventoryItem>(STORES.INVENTORY, cid); }
  async addInventoryItem(i: InventoryItem) { return this.add(STORES.INVENTORY, i); }
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>) { return this.update(STORES.INVENTORY, id, updates); }
  async getTimesheets(cid?: string): Promise<Timesheet[]> { return this.getAll<Timesheet>(STORES.TIMESHEETS, cid); }
  async addTimesheet(t: Timesheet) { return this.add(STORES.TIMESHEETS, t); }
  async updateTimesheet(id: string, updates: Partial<Timesheet>) { return this.update(STORES.TIMESHEETS, id, updates); }
  async getInvoices(cid?: string): Promise<Invoice[]> { return this.getAll<Invoice>(STORES.INVOICES, cid); }
  async addInvoice(i: Invoice) { return this.add(STORES.INVOICES, i); }
  async updateInvoice(id: string, updates: Partial<Invoice>) { return this.update(STORES.INVOICES, id, updates); }
  async deleteInvoice(id: string) { return this.delete(STORES.INVOICES, id); }
}

export const db = new DatabaseService();
