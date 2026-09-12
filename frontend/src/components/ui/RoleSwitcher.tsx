import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Briefcase, Cpu, Eye, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  accentColor: string;
}

const ROLES: RoleOption[] = [
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
    title: 'Auditor / Viewer',
    description: 'Read-only audit transparency',
    icon: Eye,
    accentColor: 'var(--text-secondary)',
  },
];

interface RoleSwitcherProps {
  compact?: boolean;
  onRoleChange?: (newRole: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ compact = false, onRoleChange }) => {
  const { role, setRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentRole = ROLES.find((r) => r.role === role) || ROLES[1];
  const CurrentIcon = currentRole.icon;

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

  const handleSelectRole = (newRole: UserRole) => {
    setRole(newRole);
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
        display: 'inline-block',
        zIndex: 50,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Active Role Perspective Switcher"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 6 : 8,
          padding: compact ? '4px 8px' : '5px 12px',
          backgroundColor: isOpen ? 'var(--graphite)' : 'var(--bg-surface-2)',
          border: `1px solid ${isOpen ? currentRole.accentColor : 'var(--border-hairline-alt)'}`,
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: compact ? 11 : 12,
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          width: compact ? '100%' : 'auto',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <CurrentIcon size={compact ? 13 : 15} style={{ color: currentRole.accentColor }} />
          <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {compact ? currentRole.title.split('/')[0].trim() : currentRole.title}
          </span>
        </div>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Dark Graphite Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select User Role"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: compact ? 'auto' : 0,
            left: compact ? 0 : 'auto',
            width: 250,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline-alt)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeIn 0.15s ease-out',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '6px 8px 4px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--border-hairline)',
              marginBottom: 2,
            }}
          >
            Switch Role Perspective
          </div>

          {ROLES.map((item) => {
            const isSelected = item.role === role;
            const ItemIcon = item.icon;

            return (
              <button
                key={item.role}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectRole(item.role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected
                    ? 'var(--bg-surface-2)'
                    : 'transparent',
                  border: isSelected
                    ? '1px solid var(--border-hairline)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
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
                    <ItemIcon size={14} />
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
                        fontSize: 10,
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
