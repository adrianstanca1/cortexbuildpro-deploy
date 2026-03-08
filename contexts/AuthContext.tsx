
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole, FeatureEntitlements, Permission, ROLE_PERMISSIONS, AuditLog, UserStatus } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (data: Partial<UserProfile>, password?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  can: (permission: Permission) => boolean;
  checkFeature: (feature: keyof FeatureEntitlements) => boolean;
  addProjectId: (id: string) => void;
  impersonateTenant: (companyId: string, companyName: string) => void;
  stopImpersonating: () => void;
  isImpersonating: boolean;
  impersonatedTenantName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedTenantName, setImpersonatedTenantName] = useState<string | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      // Ensure DB is seeded and ready before we decide on loading state
      try {
        const database = await db.getUser('trigger-open'); // This will trigger open and wait for seeding
      } catch (e) {
        // Ignore failure of the trigger, it's just to ensure open() finished
      }

      const storedToken = localStorage.getItem('buildpro_session_shard');
      if (storedToken) {
        try {
          const userId = storedToken.split('_')[1];
          const userData = await db.getUser(userId);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem('buildpro_session_shard');
          }
        } catch (e) {
          localStorage.removeItem('buildpro_session_shard');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const logAudit = async (action: string, targetId: string, reason: string, metadata?: any) => {
    if (!user) return;
    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorName: user.name,
      action,
      targetId,
      targetType: 'COMPANY',
      tenantId: targetId,
      timestamp: new Date().toISOString(),
      reason,
      metadata
    };
    await db.addAuditLog(log);
  };

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
        const userData = await db.getByUserEmail(email.toLowerCase());
        if (!userData) throw new Error("Identity node not found in global mesh.");
        
        // Removed status and MFA checks for direct access
        setUser(userData);
        localStorage.setItem('buildpro_session_shard', `session_${userData.id}`);
    } finally {
        setIsLoading(false);
    }
  };

  const signUp = async (data: Partial<UserProfile>, password?: string) => {
      setIsLoading(true);
      try {
          const id = `u-${Date.now()}`;
          const normalizedEmail = data.email?.toLowerCase() || '';
          const newUser: UserProfile = {
              id,
              name: data.name || 'Anonymous Node',
              email: normalizedEmail,
              role: data.role || UserRole.OPERATIVE,
              status: 'ACTIVE', // Automatically set to active
              phone: data.phone || '',
              companyId: data.companyId || `c-genesis-01`, // Default to genesis shard
              projectIds: [],
              avatarInitials: data.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
              features: {
                  aiAssistant: true,
                  imagineStudio: true,
                  financials: true,
                  advancedRBAC: false,
                  liveVision: true,
                  bimAnalytics: true
              },
              createdAt: new Date().toISOString()
          };
          await db.saveUser(newUser);
          setUser(newUser);
          localStorage.setItem('buildpro_session_shard', `session_${newUser.id}`);
      } finally {
          setIsLoading(false);
      }
  };

  const impersonateTenant = (companyId: string, companyName: string) => {
    if (!can(Permission.BREAK_GLASS_ACCESS)) return;
    if (!originalUser) setOriginalUser(user);
    logAudit('IMPERSONATION_STARTED', companyId, `Break-Glass access requested for ${companyName}`);
    setUser({ ...user!, companyId, projectIds: ['ALL'] });
    setIsImpersonating(true);
    setImpersonatedTenantName(companyName);
  };

  const stopImpersonating = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      setIsImpersonating(false);
      setImpersonatedTenantName(null);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('buildpro_session_shard');
  };

  const hasPermission = (allowedRoles: UserRole[]) => user ? allowedRoles.includes(user.role) : false;
  const can = (perm: Permission): boolean => user ? (ROLE_PERMISSIONS[user.role] || []).includes(perm) : false;
  const checkFeature = (feat: keyof FeatureEntitlements): boolean => {
      if (!user) return false;
      if (user.role === UserRole.SUPER_ADMIN && !isImpersonating) return true;
      return user.features?.[feat] || false;
  };

  const addProjectId = (pid: string) => {
      if (user && !user.projectIds?.includes(pid)) {
          const updated = { ...user, projectIds: [...(user.projectIds || []), pid] };
          setUser(updated);
          db.saveUser(updated);
      }
  };

  return (
    <AuthContext.Provider value={{ 
      user, isLoading, signIn, signUp, logout, hasPermission, can, checkFeature, addProjectId, 
      impersonateTenant, stopImpersonating, isImpersonating, impersonatedTenantName
    }}>
      {children}
    </AuthContext.Provider>
  );
};
