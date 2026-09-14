/**
 * Role-Based Access Control (RBAC) Context for SIH26023
 * Manages active user role, permissions, and role-differentiated behaviors.
 * Enforces strict boundaries: Public Registered Users and unauthenticated visitors
 * have an immutable effective role of VIEWER and CANNOT escalate to operational roles.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, RoleInfo, ROLE_DEFINITIONS } from '@/types';
import { authService } from '@/services/api';

export type AccountType = 'PUBLIC_VIEWER' | 'AUTHORITY';

export interface AuthUser {
  email: string;
  name?: string;
  organization?: string;
  accountType: AccountType;
  authorizedRole: UserRole;
  token?: string;
}

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  isPublicViewerAccount: boolean;
  roleInfo: RoleInfo;
  isAdmin: boolean;
  isOfficer: boolean;
  isAnalyst: boolean;
  isViewer: boolean;
  isOfficerOrAbove: boolean;
  isAnalystOrAbove: boolean;
  canUpload: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canModifySettings: boolean;
  canExecuteWorkflows: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_ROLE = 'cil_user_role';
const STORAGE_KEY_USER = 'cil_auth_user';
const STORAGE_KEY_TOKEN = 'cil_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Authenticated User Session
  const [user, setUserState] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_USER);
        if (saved) {
          return JSON.parse(saved) as AuthUser;
        }
      } catch {
        // Fallback on parse failure
      }
    }
    return null;
  });

  // Determine whether current session is a public viewer account (or unauthenticated visitor)
  const isPublicViewerAccount = !user || user.accountType === 'PUBLIC_VIEWER' || user.authorizedRole === 'VIEWER';

  // 2. Active Role (Strictly Guarded by Authenticated User Clearance)
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUserStr = localStorage.getItem(STORAGE_KEY_USER);
        if (savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr) as AuthUser;
          if (parsedUser.accountType === 'PUBLIC_VIEWER' || parsedUser.authorizedRole === 'VIEWER') {
            localStorage.setItem(STORAGE_KEY_ROLE, 'VIEWER');
            return 'VIEWER';
          }
          const authRole = parsedUser.authorizedRole || 'VIEWER';
          localStorage.setItem(STORAGE_KEY_ROLE, authRole);
          return authRole;
        }
      } catch {
        // Fallback
      }
    }
    // Default fallback: If no authenticated user, default to VIEWER
    return 'VIEWER';
  });

  // Guard: Continuously enforce authorized role
  useEffect(() => {
    const expectedRole = user ? user.authorizedRole : 'VIEWER';
    if (role !== expectedRole) {
      setRoleState(expectedRole);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ROLE, expectedRole);
      }
    }
  }, [user, role]);

  // Sync session with backend on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (token) {
      authService
        .getMe()
        .then((res) => {
          if (res.authenticated && res.user) {
            const serverUser: AuthUser = {
              email: res.user.email,
              name: res.user.name,
              accountType: res.user.accountType,
              authorizedRole: res.user.authorizedRole as UserRole,
            };
            setUserState(serverUser);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(serverUser));
          } else {
            // Session invalidated on server
            setUserState(null);
            setRoleState('VIEWER');
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.setItem(STORAGE_KEY_ROLE, 'VIEWER');
          }
        })
        .catch(() => {
          // In offline / mock dev mode, retain local state
        });
    }
  }, []);

  const login = useCallback((newUser: AuthUser, token?: string) => {
    setUserState(newUser);
    const assignedRole =
      newUser.accountType === 'PUBLIC_VIEWER' ? 'VIEWER' : newUser.authorizedRole || 'VIEWER';
    setRoleState(assignedRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_ROLE, assignedRole);
      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
      } else if (newUser.token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, newUser.token);
      }
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    setUserState(null);
    setRoleState('VIEWER');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.setItem(STORAGE_KEY_ROLE, 'VIEWER');
    }
  }, []);

  /**
   * Set Role with Strict Access Control Enforcement
   * Returns `false` if privilege escalation or switching to an unauthorized role is attempted.
   */
  const setRole = useCallback(
    (newRole: UserRole): boolean => {
      const normalized = newRole.toUpperCase() as UserRole;
      if (!ROLE_DEFINITIONS[normalized]) {
        return false;
      }

      const activeAuthorized = user ? user.authorizedRole : 'VIEWER';
      if (normalized !== activeAuthorized) {
        console.warn(
          `[RBAC SECURITY VIOLATION] Session authorized as '${activeAuthorized}' attempted unauthorized switch to '${normalized}'. Action rejected.`
        );
        return false;
      }

      setRoleState(normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ROLE, normalized);
      }
      return true;
    },
    [user]
  );

  const value = useMemo(() => {
    const effectiveRole = user ? user.authorizedRole : 'VIEWER';
    const roleInfo = ROLE_DEFINITIONS[effectiveRole] || ROLE_DEFINITIONS.VIEWER;
    const level = roleInfo.level;

    return {
      role: effectiveRole,
      setRole,
      user,
      isAuthenticated: !!user,
      login,
      logout,
      isPublicViewerAccount,
      roleInfo,
      isAdmin: effectiveRole === 'ADMIN',
      isOfficer: effectiveRole === 'OFFICER',
      isAnalyst: effectiveRole === 'ANALYST',
      isViewer: effectiveRole === 'VIEWER',
      isOfficerOrAbove: level >= 3,
      isAnalystOrAbove: level >= 2,
      canUpload: level >= 2,
      canApprove: level >= 3,
      canDelete: level >= 4,
      canModifySettings: level >= 4,
      canExecuteWorkflows: level >= 2,
    };
  }, [role, setRole, user, login, logout, isPublicViewerAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
