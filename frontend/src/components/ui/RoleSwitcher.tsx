import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Briefcase, Cpu, Eye, Check, ChevronDown, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { UserRole } from '@/types';

export interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  accentColor: string;
}

export const ROLES: RoleOption[] = [
  {
    role: 'ANALYST',
    title: 'Mining Analyst',
    description: 'Mining operations & intelligence',
    icon: Briefcase,
    accentColor: 'var(--accent-teal)',
  },
  {
    role: 'OFFICER',
    title: 'Reviewing Officer',
    description: 'Statutory review & sign-off',
    icon: ShieldCheck,
    accentColor: 'var(--accent-primary)',
  },
  {
    role: 'ADMIN',
    title: 'System Admin',
    description: 'System health & administration',
    icon: Cpu,
    accentColor: 'var(--status-warning)',
  },
  {
    role: 'VIEWER',
    title: 'Public Auditor',
    description: 'Read-only audit transparency',
    icon: Eye,
    accentColor: 'var(--text-secondary)',
  },
];

export interface RoleSwitcherProps {
  variant?: 'topbar' | 'sidebar';
  compact?: boolean;
  onRoleChange?: (newRole: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  variant = 'topbar',
  compact = false,
  onRoleChange,
}) => {
  const { role, setRole, user } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const authorizedRole = user ? user.authorizedRole : 'VIEWER';
  const currentRole = ROLES.find((r) => r.role === role) || ROLES[3];
  const CurrentIcon = currentRole.icon;

  const isSidebar = variant === 'sidebar';
  const isPublicViewerAccount = !user || user.accountType === 'PUBLIC_VIEWER' || user.authorizedRole === 'VIEWER';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRestrictedClick = (roleTitle: string) => {
    toast.error(
      'Access Restricted',
      `Clearance restricted. '${roleTitle}' perspective requires dedicated credentials. Current session is authorized as ${authorizedRole}.`
    );
  };

  const handleSelectRole = (newRole: UserRole) => {
    if (newRole !== authorizedRole) {
      const target = ROLES.find((r) => r.role === newRole);
      handleRestrictedClick(target?.title || newRole);
      return;
    }
    const success = setRole(newRole);
    if (!success) {
      const target = ROLES.find((r) => r.role === newRole);
      handleRestrictedClick(target?.title || newRole);
      return;
    }
    if (onRoleChange) {
      onRoleChange(newRole);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: isSidebar ? 'block' : 'inline-block',
        width: isSidebar ? '100%' : 'auto',
        zIndex: 50,
      }}
    >
      {/* Sidebar Mode: Section Label */}
      {isSidebar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2px 4px',
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ROLE PERSPECTIVE
          </span>
          {isPublicViewerAccount && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: 'var(--status-warning)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Auditor Only
            </span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Switch Role Perspective"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 6 : 8,
          padding: isSidebar ? '6px 8px' : compact ? '4px 8px' : '5px 12px',
          backgroundColor: isOpen ? 'var(--graphite)' : 'var(--bg-surface-2)',
          border: `1px solid ${isOpen ? currentRole.accentColor : 'var(--border-hairline-alt)'}`,
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: compact || isSidebar ? 11 : 12,
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          width: isSidebar || compact ? '100%' : 'auto',
          justifyContent: 'space-between',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--graphite)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <CurrentIcon size={compact || isSidebar ? 13 : 15} style={{ color: currentRole.accentColor, flexShrink: 0 }} />
          <span
            style={{
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentRole.title}
          </span>
          {isPublicViewerAccount && !isSidebar && (
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              Public
            </span>
          )}
        </div>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dark Graphite Accessible Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Role Perspective Options"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: isSidebar ? 'auto' : 0,
            left: isSidebar ? 0 : 'auto',
            width: isSidebar ? '100%' : 290,
            minWidth: 260,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline-alt)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            animation: 'fadeIn 0.15s ease-out',
            zIndex: 1000,
          }}
        >
          {/* Header Row */}
          <div
            style={{
              padding: '6px 8px 5px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--border-hairline)',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>ROLE PERSPECTIVE</span>
            {isPublicViewerAccount ? (
              <span
                style={{
                  fontSize: 9,
                  color: 'var(--status-warning)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                PUBLIC AUDITOR
              </span>
            ) : (
              <span style={{ fontSize: 9, color: 'var(--accent-primary)', fontWeight: 600 }}>
                AUTHORITY ACCESS
              </span>
            )}
          </div>

          {/* Role List */}
          {ROLES.map((item) => {
            const isSelected = item.role === authorizedRole;
            const isRestricted = item.role !== authorizedRole;
            const ItemIcon = item.icon;

            // RESTRICTED TREATMENT (For any role not matching the authenticated authorizedRole)
            if (isRestricted) {
              return (
                <div
                  key={item.role}
                  role="option"
                  aria-selected={false}
                  aria-disabled="true"
                  data-testid={`role-option-${item.role.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRestrictedClick(item.title);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    cursor: 'not-allowed',
                    opacity: 0.45,
                    userSelect: 'none',
                    transition: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {item.description} • Required
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '2px 5px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--status-error)',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    RESTRICTED
                  </span>
                </div>
              );
            }

            // ACTIVE / SELECTABLE ROLE TREATMENT
            return (
              <button
                key={item.role}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-testid={`role-option-${item.role.toLowerCase()}`}
                onClick={() => handleSelectRole(item.role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--bg-surface-2)' : 'transparent',
                  border: isSelected ? `1px solid ${item.accentColor}44` : '1px solid transparent',
                  cursor: 'pointer',
                  opacity: 1,
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--graphite)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-2)',
                      border: `1px solid ${isSelected ? item.accentColor : 'var(--border-hairline)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.accentColor,
                      flexShrink: 0,
                    }}
                  >
                    <ItemIcon size={13} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} style={{ color: item.accentColor, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
