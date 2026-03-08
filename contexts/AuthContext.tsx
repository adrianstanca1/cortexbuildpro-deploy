import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

interface OAuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'github' | 'google';
}

interface AuthContextType {
  user: UserProfile | null;
  login: (role: UserRole) => void;
  loginWithOAuth: (oauthUser: OAuthUser) => void;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  addProjectId: (id: string) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'buildpro_auth';
const TOKEN_STORAGE_KEY = 'buildpro_token';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (storedAuth) {
      try {
        const parsedUser = JSON.parse(storedAuth);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (role: UserRole) => {
    // Simulating backend user retrieval based on role selection
    let mockUser: UserProfile;

    switch (role) {
      case UserRole.SUPER_ADMIN:
        mockUser = {
          id: 'u1',
          name: 'John Anderson',
          email: 'john@buildcorp.com',
          phone: '+44 7700 900001',
          role: UserRole.SUPER_ADMIN,
          avatarInitials: 'JA',
          companyId: 'ALL',
          projectIds: ['ALL']
        };
        break;
      case UserRole.COMPANY_ADMIN:
        mockUser = {
          id: 'u2',
          name: 'Sarah Mitchell',
          email: 'sarah@buildcorp.com',
          phone: '+44 7700 900002',
          role: UserRole.COMPANY_ADMIN,
          avatarInitials: 'SM',
          companyId: 'c1',
          projectIds: ['p1', 'p2']
        };
        break;
      case UserRole.SUPERVISOR:
        mockUser = {
          id: 'u3',
          name: 'Mike Thompson',
          email: 'mike@buildcorp.com',
          phone: '+44 7700 900003',
          role: UserRole.SUPERVISOR,
          avatarInitials: 'MT',
          companyId: 'c1',
          projectIds: ['p1']
        };
        break;
      case UserRole.OPERATIVE:
        mockUser = {
          id: 'u4',
          name: 'David Chen',
          email: 'david@buildcorp.com',
          phone: '+44 7700 900004',
          role: UserRole.OPERATIVE,
          avatarInitials: 'DC',
          companyId: 'c1',
          projectIds: ['p1']
        };
        break;
      default:
        return;
    }
    setUser(mockUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
  };

  const loginWithOAuth = (oauthUser: OAuthUser) => {
    // Map OAuth user to UserProfile
    const userProfile: UserProfile = {
      id: oauthUser.id,
      name: oauthUser.name,
      email: oauthUser.email,
      phone: '',
      role: UserRole.OPERATIVE, // Default role for OAuth users - minimal privileges
      avatarInitials: oauthUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      avatarUrl: oauthUser.avatarUrl,
      companyId: 'c1',
      projectIds: [],
      provider: oauthUser.provider,
    };

    setUser(userProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
  };

  const logout = async () => {
    // Call logout endpoint if we have a token
    if (token) {
      try {
        await fetch('/api/auth/github/logout', { method: 'POST' });
      } catch (e) {
        // Ignore logout errors
      }
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const hasPermission = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const addProjectId = (projectId: string) => {
    if (user && user.projectIds && !user.projectIds.includes(projectId) && !user.projectIds.includes('ALL')) {
        const updatedUser = {
            ...user,
            projectIds: [...user.projectIds, projectId]
        };
        setUser(updatedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithOAuth, logout, hasPermission, addProjectId, token }}>
      {children}
    </AuthContext.Provider>
  );
};