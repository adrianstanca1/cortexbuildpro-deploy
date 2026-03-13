export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  COMPANY_OWNER = 'COMPANY_OWNER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATIVE = 'OPERATIVE',
  AUDITOR = 'AUDITOR',
}

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

export enum Permission {
  TENANT_PROJECT_ADMIN = 'TENANT_PROJECT_ADMIN',
  TENANT_IDENTITY_ADMIN = 'TENANT_IDENTITY_ADMIN',
  TENANT_FINANCIAL_ADMIN = 'TENANT_FINANCIAL_ADMIN',
  TENANT_SETTINGS_ADMIN = 'TENANT_SETTINGS_ADMIN',
  TENANT_SOVEREIGN_OPS = 'TENANT_SOVEREIGN_OPS',
  TENANT_PROVISIONING = 'TENANT_PROVISIONING',
  TENANT_AUDIT_VIEW = 'TENANT_AUDIT_VIEW',
  PLATFORM_GOVERNANCE = 'PLATFORM_GOVERNANCE',
  SYSTEM_DIAGNOSTICS = 'SYSTEM_DIAGNOSTICS',
  BREAK_GLASS_ACCESS = 'BREAK_GLASS_ACCESS',
  TENANT_QUOTA_MGMT = 'TENANT_QUOTA_MGMT',
  TENANT_LIFECYCLE_MGMT = 'TENANT_LIFECYCLE_MGMT',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.SUPPORT_ADMIN]: [
    Permission.SYSTEM_DIAGNOSTICS,
    Permission.TENANT_LIFECYCLE_MGMT,
    Permission.TENANT_PROVISIONING,
    Permission.BREAK_GLASS_ACCESS
  ],
  [UserRole.COMPANY_OWNER]: [
    Permission.TENANT_PROJECT_ADMIN, 
    Permission.TENANT_IDENTITY_ADMIN,
    Permission.TENANT_FINANCIAL_ADMIN,
    Permission.TENANT_SETTINGS_ADMIN,
    Permission.TENANT_SOVEREIGN_OPS,
    Permission.TENANT_AUDIT_VIEW
  ],
  [UserRole.COMPANY_ADMIN]: [
    Permission.TENANT_PROJECT_ADMIN, 
    Permission.TENANT_IDENTITY_ADMIN,
    Permission.TENANT_SETTINGS_ADMIN,
    Permission.TENANT_AUDIT_VIEW
  ],
  [UserRole.SUPERVISOR]: [Permission.TENANT_PROJECT_ADMIN],
  [UserRole.OPERATIVE]: [],
  [UserRole.AUDITOR]: [
    Permission.SYSTEM_DIAGNOSTICS,
    Permission.PLATFORM_GOVERNANCE 
  ],
};

export enum Page {
  PLATFORM_PULSE = 'PLATFORM_PULSE',
  SYSTEM_CONSOLE = 'SYSTEM_CONSOLE',
  COMPANIES_HUB = 'COMPANIES_HUB',
  SECURITY = 'SECURITY',
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  TASKS = 'TASKS',
  LIVE = 'LIVE',
  CHAT = 'CHAT',
  IMAGINE = 'IMAGINE',
  FINANCIALS = 'FINANCIALS',
  TEAM = 'TEAM',
  MARKETPLACE = 'MARKETPLACE',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  TIMESHEETS = 'TIMESHEETS',
  DOCUMENTS = 'DOCUMENTS',
  SAFETY = 'SAFETY',
  EQUIPMENT = 'EQUIPMENT',
  TEAM_CHAT = 'TEAM_CHAT',
  AI_TOOLS = 'AI_TOOLS',
  ML_INSIGHTS = 'ML_INSIGHTS',
  COMPLIANCE = 'COMPLIANCE',
  PROCUREMENT = 'PROCUREMENT',
  SCHEDULE = 'SCHEDULE',
  CUSTOM_DASH = 'CUSTOM_DASH',
  REPORTS = 'REPORTS',
  WORKFORCE = 'WORKFORCE',
  INTEGRATIONS = 'INTEGRATIONS',
  PROFILE = 'PROFILE',
  MAP_VIEW = 'MAP_VIEW',
  CLIENTS = 'CLIENTS',
  INVENTORY = 'INVENTORY',
  DEV_SANDBOX = 'DEV_SANDBOX',
  MY_DESKTOP = 'MY_DESKTOP',
  LIVE_PROJECT_MAP = 'LIVE_PROJECT_MAP',
  PROJECT_LAUNCHPAD = 'PROJECT_LAUNCHPAD',
  LOGIN = 'LOGIN',
  EXECUTIVE = 'EXECUTIVE',
  COMPANY_SETTINGS = 'COMPANY_SETTINGS',
  VISION = 'VISION',
  ARCHITECTURE = 'ARCHITECTURE',
  MESH = 'MESH',
  INTELLIGENCE_HUB = 'INTELLIGENCE_HUB',
}

export interface FeatureEntitlements {
  aiAssistant: boolean;
  imagineStudio: boolean;
  financials: boolean;
  advancedRBAC: boolean;
  liveVision: boolean;
  bimAnalytics: boolean;
}

export interface CompanyLimits {
  userSeats: number;
  projects: number;
  storageGB: number;
  apiCallsPerMonth: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  companyId: string;
  projectIds: string[];
  avatarInitials: string;
  features: FeatureEntitlements;
  avatar?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  isThinking?: boolean;
  timestamp: number;
  groundingMetadata?: any;
}

export interface ProjectSettings {
  budgetAlertThreshold: number;
  budgetAlertEnabled: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
    criticalOnly: boolean;
  };
  customFields: { id: string; key: string; value: string }[];
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string;
  location: string;
  type: 'Commercial' | 'Residential' | 'Industrial' | 'Infrastructure' | 'Healthcare';
  status: 'Active' | 'Planning' | 'Delayed' | 'Completed';
  health: 'Good' | 'At Risk' | 'Critical';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  image: string;
  teamSize: number;
  tasks: { total: number; completed: number; overdue: number };
  weatherLocation?: { city: string; temp: string; condition: string };
  aiAnalysis?: string;
  latitude?: number;
  longitude?: number;
  zones?: Zone[];
  healthScore?: number;
  riskVectors?: { label: string; score: number; color: string }[];
  timelineOptimizations?: string[];
  settings?: ProjectSettings;
  phases?: ProjectPhase[];
}

export interface Task {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  priority: 'High' | 'Medium' | 'Low' | 'Critical';
  assigneeName?: string;
  assigneeId?: string;
  assigneeType: 'user' | 'role';
  dueDate: string;
  dependencies?: string[];
  subtasks?: SubTask[];
  comments?: TaskComment[];
  progress?: number;
  latitude?: number;
  longitude?: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timestamp: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  companyId: string;
  name: string;
  initials: string;
  role: UserRole;
  status: 'On Site' | 'Off Site' | 'On Break' | 'Leave';
  projectId?: string;
  projectName?: string;
  phone?: string;
  email?: string;
  color?: string;
  location?: string;
  skills?: string[];
  joinDate?: string;
  performanceRating?: number;
  completedProjects?: number;
  certifications?: Certification[];
  hourlyRate?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired';
  fileName?: string;
  fileType?: string;
  fileData?: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'Document' | 'Image' | 'PDF' | 'CAD' | 'Spreadsheet';
  projectId: string;
  companyId: string;
  projectName: string;
  size: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Draft';
  url?: string;
  linkedTaskIds?: string[];
}

export interface ProjectDrawing {
  id: string;
  name: string;
  type: string;
  category: 'Structural' | 'Architectural' | 'MEP' | 'Site';
  projectId: string;
  companyId: string;
  uploader: string;
  date: string;
  size: string;
  url: string;
  version?: number;
  revisionNotes?: string;
  linkedTaskIds?: string[];
  markups?: DrawingMarkup[];
  aiAnalysis?: string;
}

export interface DrawingMarkup {
  id: string;
  type: 'PUNCH' | 'RFI' | 'NOTE';
  x: number;
  y: number;
  title: string;
  description?: string;
  status: string;
}

export interface SitePhoto {
  id: string;
  name: string;
  projectId: string;
  companyId: string;
  uploader: string;
  date: string;
  url: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  contactPerson: string;
  role: string;
  email: string;
  phone: string;
  status: 'Active' | 'Lead' | 'Inactive';
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Government';
  activeProjects: number;
  totalValue: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  threshold: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastOrderDate?: string;
  costPerUnit?: number;
}

export interface Zone {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
  type: 'danger' | 'warning' | 'info';
  protocol?: string;
  trigger?: string;
}

export interface RFI {
  id: string;
  companyId: string;
  projectId: string;
  number: string;
  subject: string;
  question: string;
  answer?: string;
  assignedTo: string;
  status: 'Open' | 'Closed';
  dueDate: string;
  createdAt: string;
  linkedTaskIds?: string[];
  attachments?: { name: string; url: string; type: string }[];
}

export interface ChangeOrder {
  id: string;
  companyId: string;
  projectId: string;
  number: string;
  title: string;
  description: string;
  reason: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  amount: number;
  scheduleImpactDays: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface PunchItem {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  location: string;
  description?: string;
  status: 'Open' | 'Resolved' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo?: string;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  companyId: string;
  projectId: string;
  date: string;
  weather?: string;
  notes?: string;
  workPerformed?: string;
  crewCount?: number;
  author: string;
  createdAt: string;
}

export interface Daywork {
  id: string;
  companyId: string;
  projectId: string;
  date: string;
  description: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  createdAt: string;
  labor: any[];
  materials: any[];
  attachments: any[];
  totalLaborCost?: number;
  totalMaterialCost?: number;
  grandTotal?: number;
}

export interface SafetyIncident {
  id: string;
  companyId: string;
  projectId?: string;
  title: string;
  project: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved' | 'Investigating';
  date: string;
  type: string;
}

export interface SafetyHazard {
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  riskScore: number;
  description: string;
  recommendation: string;
  regulation?: string;
  box_2d?: [number, number, number, number];
}

export interface Equipment {
  id: string;
  companyId: string;
  projectId: string;
  projectName?: string;
  name: string;
  type: string;
  status: 'In Use' | 'Available' | 'Maintenance';
  lastService: string;
  nextService: string;
}

export interface Timesheet {
  id: string;
  companyId: string;
  employeeName: string;
  projectName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Invoice {
  id: string;
  companyId: string;
  projectId: string;
  projectName?: string;
  projectCode?: string;
  invoiceNumber: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Overdue' | 'Pending' | 'Approved' | 'Rejected';
  description?: string;
  createdAt: string;
  items?: InvoiceItem[];
  linkedTaskIds?: string[];
  aiAuditNotes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type CompanyStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type DeploymentState = 'INITIALIZING' | 'ACTIVE' | 'FAILED';

export interface SecurityProfile {
  ssoEnabled: boolean;
  mfaRequired: boolean;
  sessionTTL: number;
  passwordPolicy: 'Strong' | 'Standard';
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  status: CompanyStatus;
  deploymentState: DeploymentState;
  industry: string;
  region: string;
  timezone: string;
  currency: string;
  plan: 'Enterprise' | 'Business' | 'Starter';
  limits: CompanyLimits;
  features: FeatureEntitlements;
  securityProfile: SecurityProfile;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  usersCount: number;
  projectsCount: number;
  projectProgress: number;
  logoUrl?: string;
  dbMetrics?: any;
  apiKeys?: ApiKey[];
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string;
  targetType: 'COMPANY' | 'SYSTEM_CONFIG' | 'API_KEY' | 'SECURITY_POLICY' | 'USER_APPROVAL' | 'INVITATION';
  tenantId: string;
  timestamp: string;
  reason?: string;
  metadata?: any;
}

export interface SystemConfig {
  id: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  globalSessionTTL: number;
  enforceMFAAcrossPlatform: boolean;
  aiTokenLimitPerTenant: number;
  version: string;
  globalFeatureFlags: Record<string, boolean>;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface ApiKey {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  usageCount: number;
  status: 'ACTIVE' | 'REVOKED';
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Complete' | 'In Progress' | 'Upcoming' | 'Delayed';
  progress?: number;
  subtasks?: SubTask[];
}

export interface CustomField {
  id: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  ownerName: string;
}

export interface CompanyAlert {
  id: string;
}