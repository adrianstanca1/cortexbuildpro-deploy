import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Company, AuditLog, CompanyStatus, UserRole, FeatureEntitlements, CompanyLimits, SystemConfig, UserProfile, UserStatus, Invitation, Project, Task, RFI, PunchItem } from '../types';
import { db } from '../services/db';
import { useAuth } from './AuthContext';

export interface TransitionProtocol {
    from: CompanyStatus;
    to: CompanyStatus;
    name: string;
    intent: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ProvisionParams {
  name: string;
  industry: string;
  ownerEmail: string;
  ownerName: string;
  plan: Company['plan'];
  region: string;
  idempotencyKey?: string;
}

interface ProvisionResult {
  companyId: string;
  invitationToken: string;
  infrastructure: {
      dbCluster: string;
      blobBucket: string;
      aiPartition: string;
  };
}

interface SuperAdminContextType {
    companies: Company[];
    auditLogs: AuditLog[];
    systemConfig: SystemConfig | null;
    globalUsers: UserProfile[];
    pendingUsers: UserProfile[];
    isLoading: boolean;
    provisionCompany: (params: ProvisionParams) => Promise<ProvisionResult>;
    updateCompany: (id: string, updates: Partial<Company>, reason?: string) => Promise<void>;
    updateCompanyStatus: (id: string, status: CompanyStatus, reason: string) => Promise<void>;
    updateSystemConfig: (updates: Partial<SystemConfig>) => Promise<void>;
    toggleGlobalFlag: (flag: string) => Promise<void>;
    getAuditHistory: (companyId: string) => AuditLog[];
    getValidStatusTransitions: (currentStatus: CompanyStatus) => CompanyStatus[];
    getTransitionProtocol: (from: CompanyStatus, to: CompanyStatus) => TransitionProtocol | null;
    updateCompanyEntitlements: (id: string, features: Partial<FeatureEntitlements>) => Promise<void>;
    updateCompanyLimits: (id: string, limits: Partial<CompanyLimits>) => Promise<void>;
    updateCompanyLogo: (id: string, logoUrl: string | null) => Promise<void>;
    approveUser: (userId: string) => Promise<void>;
    rejectUser: (userId: string) => Promise<void>;
    refreshGlobalRegistry: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useControlPlane = () => {
    const context = useContext(SuperAdminContext);
    if (!context) throw new Error('useControlPlane must be used within a SuperAdminProvider');
    return context;
};

const LIFECYCLE_PROTOCOLS: TransitionProtocol[] = [
    { from: 'DRAFT', to: 'ACTIVE', name: 'Genesis Protocol', intent: 'Synchronize uninitialized shard with global logic mesh.', severity: 'MEDIUM' },
    { from: 'DRAFT', to: 'ARCHIVED', name: 'Abort Protocol', intent: 'Permanent decommissioning of failed identity shard.', severity: 'LOW' },
    { from: 'ACTIVE', to: 'SUSPENDED', name: 'Isolation Protocol', intent: 'Emergency isolation of tenant node.', severity: 'HIGH' },
    { from: 'ACTIVE', to: 'ARCHIVED', name: 'Sunset Protocol', intent: 'Decommission active production cluster.', severity: 'CRITICAL' },
    { from: 'SUSPENDED', to: 'ACTIVE', name: 'Restoration Protocol', intent: 'Full re-sync of isolated tenant node.', severity: 'MEDIUM' },
    { from: 'ARCHIVED', to: 'ACTIVE', name: 'Resurrection Protocol', intent: 'Emergency authorized recovery.', severity: 'HIGH' }
];

const PLAN_DEFAULTS: Record<Company['plan'], { features: FeatureEntitlements, limits: CompanyLimits }> = {
    'Starter': {
        features: { aiAssistant: true, imagineStudio: false, financials: false, advancedRBAC: false, liveVision: false, bimAnalytics: false },
        limits: { userSeats: 5, projects: 2, storageGB: 10, apiCallsPerMonth: 1000 }
    },
    'Business': {
        features: { aiAssistant: true, imagineStudio: true, financials: true, advancedRBAC: true, liveVision: false, bimAnalytics: false },
        limits: { userSeats: 50, projects: 15, storageGB: 100, apiCallsPerMonth: 25000 }
    },
    'Enterprise': {
        features: { aiAssistant: true, imagineStudio: true, financials: true, advancedRBAC: true, liveVision: true, bimAnalytics: true },
        limits: { userSeats: 500, projects: 100, storageGB: 1000, apiCallsPerMonth: 500000 }
    }
};

export const SuperAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
    const [globalUsers, setGlobalUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processedKeys] = useState(new Set<string>());

    const loadData = useCallback(async () => {
        const isPlatformStaff = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.SUPPORT_ADMIN || user?.role === UserRole.AUDITOR;
        if (isPlatformStaff) {
            let [c, l, config, users] = await Promise.all([db.getCompanies(), db.getAuditLogs(), db.getSystemConfig(), db.getAllUsers()]);
            if (!config) {
                config = {
                    id: 'global-config', maintenanceMode: false, allowNewRegistrations: true, globalSessionTTL: 120, enforceMFAAcrossPlatform: true,
                    aiTokenLimitPerTenant: 5000000, version: 'v4.5.2-PRIME', globalFeatureFlags: { 'ai_reasoning_v3': true, 'multimodal_search': false, 'realtime_telemetry': true }
                };
                await db.updateSystemConfig(config);
            }
            setCompanies(c); setAuditLogs(l); setSystemConfig(config); setGlobalUsers(users);
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    const logAction = async (action: string, targetId: string, targetType: AuditLog['targetType'], reason?: string, metadata?: any) => {
        const log: AuditLog = {
            id: `audit-${Date.now()}`, actorId: user?.id || 'system', actorName: user?.name || 'Sovereign Node',
            action, targetId, targetType, tenantId: targetType === 'COMPANY' ? targetId : (metadata?.tenantId || 'global'), 
            timestamp: new Date().toISOString(), reason, metadata
        };
        await db.addAuditLog(log);
        setAuditLogs(prev => [log, ...prev]);
    };

    const bootstrapTenant = async (companyId: string, companyName: string, ownerName: string) => {
        const onboardingProject: Project = {
            id: `p-genesis-${companyId}`, companyId, name: `${companyName} Genesis Hub`, code: 'GEN-01',
            description: `Onboarding cluster for ${companyName}. Sync site operations.`,
            location: 'Global', type: 'Infrastructure', status: 'Active', health: 'Good', progress: 15, budget: 100000, spent: 0,
            startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            manager: ownerName, image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=80',
            teamSize: 1, tasks: { total: 0, completed: 0, overdue: 0 }
        };
        await db.addProject(onboardingProject);
        await logAction('BOOTSTRAP_COMPLETE', companyId, 'COMPANY', `Injected genesis templates for ${companyName}.`);
    };

    const provisionCompany = async (params: ProvisionParams): Promise<ProvisionResult> => {
        if (params.idempotencyKey && processedKeys.has(params.idempotencyKey)) throw new Error("Genesis already initiated.");
        if (params.idempotencyKey) processedKeys.add(params.idempotencyKey);

        const companyId = `c-${Date.now()}`;
        const defaults = PLAN_DEFAULTS[params.plan];
        const token = `tok_${Math.random().toString(36).substring(2, 15)}`;
        const infra = { dbCluster: `pg-cluster-${companyId.slice(-6)}`, blobBucket: `cortex-bucket-${companyId.slice(-6)}`, aiPartition: `reasoning-node-${Math.floor(Math.random() * 100)}` };

        try {
            const newCompany: Company = {
                id: companyId, name: params.name, slug: params.name.toLowerCase().replace(/ /g, '-'), status: 'DRAFT', deploymentState: 'INITIALIZING',
                industry: params.industry, region: params.region || 'EMEA', timezone: 'UTC', currency: 'GBP',
                plan: params.plan, limits: defaults.limits, features: defaults.features,
                securityProfile: { ssoEnabled: false, mfaRequired: true, sessionTTL: 120, passwordPolicy: 'Strong' },
                ownerId: `u-owner-${Date.now()}`, ownerEmail: params.ownerEmail, ownerName: params.ownerName,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastActivityAt: new Date().toISOString(),
                usersCount: 1, projectsCount: 1, projectProgress: 0,
                dbMetrics: { infrastructureNodes: infra, provisioningState: 'COMPLETED' }
            };

            await db.addCompany(newCompany);
            await db.addInvitation({
              id: `inv-${Date.now()}`, email: params.ownerEmail, ownerName: params.ownerName, role: UserRole.COMPANY_OWNER,
              companyId, token, status: 'PENDING', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date().toISOString()
            });

            await logAction('GENESIS_INITIALIZED', companyId, 'COMPANY', `Provisioned initial DRAFT shard.`, { plan: params.plan, infrastructure: infra });
            await bootstrapTenant(companyId, params.name, params.ownerName);
            await updateCompanyStatus(companyId, 'ACTIVE', 'Automated bootstrap successful.');
            await loadData();
            
            return { companyId, invitationToken: token, infrastructure: infra };
        } catch (error) {
            await db.delete('companies', companyId);
            if (params.idempotencyKey) processedKeys.delete(params.idempotencyKey);
            throw error;
        }
    };

    const updateCompanyStatus = async (id: string, status: CompanyStatus, reason: string) => {
        const company = companies.find(c => c.id === id);
        if (!company) throw new Error("Target shard not identified.");
        const protocol = LIFECYCLE_PROTOCOLS.find(p => p.from === company.status && p.to === status);
        if (!protocol) throw new Error("Protocol Violation.");

        await db.updateCompany(id, { status, updatedAt: new Date().toISOString(), deploymentState: 'ACTIVE' });
        await logAction('LIFECYCLE_TRANSITION', id, 'COMPANY', reason, { previousState: company.status, newState: status, protocolName: protocol.name });
        await loadData();
    };

    const updateCompany = async (id: string, updates: Partial<Company>, reason: string = 'Admin override') => {
        if (updates.status) throw new Error("Use updateCompanyStatus.");
        await db.updateCompany(id, updates);
        await logAction('SHARD_UPDATE', id, 'COMPANY', reason);
        await loadData();
    };

    const getValidStatusTransitions = (currentStatus: CompanyStatus) => LIFECYCLE_PROTOCOLS.filter(p => p.from === currentStatus).map(p => p.to);
    const getTransitionProtocol = (from: CompanyStatus, to: CompanyStatus) => LIFECYCLE_PROTOCOLS.find(p => p.from === from && p.to === to) || null;
    const getAuditHistory = (companyId: string) => auditLogs.filter(l => l.tenantId === companyId || l.targetId === companyId);
    const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
        if (!systemConfig) return;
        const updated = { ...systemConfig, ...updates };
        await db.updateSystemConfig(updated);
        setSystemConfig(updated);
        await logAction('CORE_CONFIG_TUNE', 'global', 'SYSTEM_CONFIG');
    };
    const toggleGlobalFlag = async (flag: string) => {
        if (!systemConfig) return;
        const updated = { ...systemConfig, globalFeatureFlags: { ...systemConfig.globalFeatureFlags, [flag]: !systemConfig.globalFeatureFlags[flag] } };
        await db.updateSystemConfig(updated);
        setSystemConfig(updated);
        await logAction('FLAG_ORCHESTRATION', flag, 'SYSTEM_CONFIG', `Toggled logic flag: ${flag}`);
    };
    const approveUser = async (userId: string) => {
        await db.updateUserStatus(userId, 'ACTIVE');
        await logAction('USER_APPROVAL', userId, 'USER_APPROVAL', 'Authorized identity node.');
        await loadData();
    };
    const rejectUser = async (userId: string) => {
        await db.updateUserStatus(userId, 'REJECTED');
        await logAction('USER_REJECTION', userId, 'USER_APPROVAL', 'Deauthorized identity node.');
        await loadData();
    };
    const updateCompanyEntitlements = async (id: string, features: Partial<FeatureEntitlements>) => {
        const company = companies.find(c => c.id === id);
        if (!company) return;
        await db.updateCompany(id, { features: { ...company.features, ...features } });
        await loadData();
    };
    const updateCompanyLimits = async (id: string, limits: Partial<CompanyLimits>) => {
        const company = companies.find(c => c.id === id);
        if (!company) return;
        await db.updateCompany(id, { limits: { ...company.limits, ...limits } });
        await loadData();
    };
    const updateCompanyLogo = async (id: string, logoUrl: string | null) => {
        await db.updateCompany(id, { logoUrl: logoUrl || undefined });
        await loadData();
    };

    return (
        <SuperAdminContext.Provider value={{
            companies, auditLogs, systemConfig, globalUsers,
            pendingUsers: globalUsers.filter(u => u.status === 'PENDING_APPROVAL'),
            isLoading,
            provisionCompany, updateCompany, updateCompanyStatus, updateSystemConfig, toggleGlobalFlag,
            getAuditHistory, getValidStatusTransitions, getTransitionProtocol,
            updateCompanyEntitlements, updateCompanyLimits, updateCompanyLogo,
            approveUser, rejectUser, refreshGlobalRegistry: loadData
        }}>
            {children}
        </SuperAdminContext.Provider>
    );
};
