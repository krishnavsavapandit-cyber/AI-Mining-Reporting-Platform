/**
 * Role-Based Access Control (RBAC) Context for SIH26023
 * Manages active user role, permissions, and role-differentiated behaviors.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserRole, RoleInfo, ROLE_DEFINITIONS } from '@/types';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
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

const STORAGE_KEY = 'cil_user_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as UserRole;
      if (saved && ROLE_DEFINITIONS[saved.toUpperCase() as UserRole]) {
        return saved.toUpperCase() as UserRole;
      }
    }
    return 'ANALYST';
  });

  const setRole = (newRole: UserRole) => {
    const normalized = newRole.toUpperCase() as UserRole;
    if (ROLE_DEFINITIONS[normalized]) {
      setRoleState(normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, normalized);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, role);
    }
  }, [role]);

  const value = useMemo(() => {
    const roleInfo = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.ANALYST;
    const level = roleInfo.level;

    return {
      role,
      setRole,
      roleInfo,
      isAdmin: role === 'ADMIN',
      isOfficer: role === 'OFFICER',
      isAnalyst: role === 'ANALYST',
      isViewer: role === 'VIEWER',
      isOfficerOrAbove: level >= 3,
      isAnalystOrAbove: level >= 2,
      canUpload: level >= 2,
      canApprove: level >= 3,
      canDelete: level >= 4,
      canModifySettings: level >= 4,
      canExecuteWorkflows: level >= 2,
    };
  }, [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
