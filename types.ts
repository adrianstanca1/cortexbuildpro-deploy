
import React from 'react';

export enum Page {
  LOGIN = 'LOGIN',
  PROFILE = 'PROFILE',
  AI_TOOLS = 'AI_TOOLS',
  REPORTS = 'REPORTS',
  SCHEDULE = 'SCHEDULE',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT', // AI Assistant
  TEAM_CHAT = 'TEAM_CHAT', // Team Chat
  LIVE = 'LIVE',
  PROJECTS = 'PROJECTS',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  TASKS = 'TASKS',
  TEAM = 'TEAM',
  TIMESHEETS = 'TIMESHEETS',
  DOCUMENTS = 'DOCUMENTS',
  SAFETY = 'SAFETY',
  EQUIPMENT = 'EQUIPMENT',
  FINANCIALS = 'FINANCIALS',
  MAP_VIEW = 'MAP_VIEW',
  ML_INSIGHTS = 'ML_INSIGHTS',
  COMPLIANCE = 'COMPLIANCE',
  PROCUREMENT = 'PROCUREMENT',
  CLIENTS = 'CLIENTS',
  INVENTORY = 'INVENTORY',
  CUSTOM_DASH = 'CUSTOM_DASH',
  WORKFORCE = 'WORKFORCE',
  INTEGRATIONS = 'INTEGRATIONS',
  SECURITY = 'SECURITY',
  DEV_SANDBOX = 'DEV_SANDBOX',
  MARKETPLACE = 'MARKETPLACE',
  EXECUTIVE = 'EXECUTIVE',
  IMAGINE = 'IMAGINE',
  MY_DESKTOP = 'MY_DESKTOP',
  LIVE_PROJECT_MAP = 'LIVE_PROJECT_MAP',
  PROJECT_LAUNCHPAD = 'PROJECT_LAUNCHPAD'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  SUPERVISOR = 'supervisor',
  OPERATIVE = 'operative'
}

export interface Company {
  id: string;
  name: string;
  plan: 'Enterprise' | 'Business' | 'Starter';
  status: 'Active' | 'Suspended' | 'Trial';
  users: number;
  projects: number;
  mrr: number;
  joinedDate: string;
}

export interface Zone {
  id: string;
  label: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  top: number;
  left: number;
  width: number;
  height: number;
  protocol?: string;
  trigger?: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  progress: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  color?: string;
}

export interface Project {
  id: string;
  companyId: string; // Multi-tenant segregation
  name: string;
  code: string;
  description: string;
  location: string;
  type: 'Commercial' | 'Residential' | 'Infrastructure' | 'Industrial' | 'Healthcare';
  status: 'Active' | 'Planning' | 'Delayed' | 'Completed' | 'On Hold';
  health: 'Good' | 'At Risk' | 'Critical';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  image: string;
  teamSize: number;
  tasks: {
    total: number;
    completed: number;
    overdue: number;
  };
  weatherLocation?: {
    city: string;
    temp: string;
    condition: string;
  };
  aiAnalysis?: string; // AI generated summary
  aiExecutiveSummary?: string; // New field for high-level summary
  timelineOptimizations?: string[]; // AI generated timeline optimizations
  zones?: Zone[];
  phases?: ProjectPhase[]; // New field for high-level phases
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  priority: 'High' | 'Medium' | 'Low' | 'Critical';
  assigneeId?: string;
  assigneeName?: string; // Denormalized for easy display
  assigneeType: 'user' | 'role';
  dueDate: string;
  description?: string;
  dependencies?: string[]; // Array of Task IDs that must be completed before this task. Used for blocking logic.
  latitude?: number;
  longitude?: number;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired';
  docUrl?: string;
  // Extended fields for file upload
  fileName?: string;
  fileType?: string;
  fileData?: string; // Base64 encoded string
}

export interface TeamMember {
  id: string;
  companyId: string; // Multi-tenant segregation
  name: string;
  initials: string;
  role: string;
  status: 'On Site' | 'Off Site' | 'On Break' | 'Leave';
  projectId?: string; // Current assignment
  projectName?: string; // Denormalized
  phone: string;
  email: string;
  color: string;
  // Extended Fields
  bio?: string;
  location?: string;
  joinDate?: string;
  skills?: string[];
  certifications?: Certification[];
  performanceRating?: number; // 0-100
  completedProjects?: number;
  hourlyRate?: number;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'PDF' | 'Spreadsheet' | 'Document' | 'Image' | 'CAD' | 'Other';
  projectId: string;
  projectName?: string;
  size: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Draft';
  url?: string;
  linkedTaskIds?: string[]; // Linked tasks for easy reference
  linkedDayworkId?: string; // Link to Daywork for auto-generated docs
}

export interface Client {
  id: string;
  companyId: string; // Multi-tenant segregation
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
  companyId: string; // Multi-tenant segregation
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  companyId?: string;
  projectIds?: string[];
  avatarInitials: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  category: string;
  desc: string;
  rating: number;
  downloads: string;
  icon: React.ElementType | string;
  installed: boolean;
}

export interface RFI {
  id: string;
  projectId: string;
  number: string;
  subject: string;
  question: string;
  assignedTo: string;
  status: 'Open' | 'Closed';
  dueDate: string;
  createdAt: string;
  answer?: string;
}

export interface PunchItem {
  id: string;
  projectId: string;
  title: string;
  location: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Closed' | 'Resolved';
  createdAt: string;
  assignedTo?: string;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  weather: string;
  crewCount: number;
  workPerformed: string;
  notes?: string;
  author: string;
  createdAt: string;
}

export interface DayworkLabor {
  name: string;
  hours: number;
  trade: string;
  rate?: number; // Hourly rate
}

export interface DayworkMaterial {
  item: string;
  quantity: number;
  unit: string;
  cost?: number; // Unit Cost
}

export interface DayworkAttachment {
  name: string;
  type: string;
  data: string; // Base64
  size?: string;
}

export interface Daywork {
  id: string;
  projectId: string;
  date: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  
  // Extended Details
  labor?: DayworkLabor[];
  materials?: DayworkMaterial[];
  attachments?: DayworkAttachment[];
  
  // Financials
  totalLaborCost?: number;
  totalMaterialCost?: number;
  grandTotal?: number;
}

export interface SafetyIncident {
  id?: string;
  title: string;
  project: string;
  projectId?: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved' | 'Investigating';
  date: string;
  type: string;
}

export interface SafetyHazard {
  id?: string;
  type: string; // Short classification
  severity: 'High' | 'Medium' | 'Low';
  riskScore?: number; // 1-10
  description?: string;
  recommendation: string;
  regulation?: string; // e.g. OSHA 1926.501
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  timestamp?: number | string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'In Use' | 'Available' | 'Maintenance';
  projectId?: string;
  projectName?: string;
  lastService: string;
  nextService: string;
  companyId?: string;
  image?: string; // Added image field
}

export interface Timesheet {
  id: string;
  employeeId?: string;
  employeeName: string;
  projectId?: string;
  projectName: string;
  date: string;
  hours: number;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  companyId?: string;
}