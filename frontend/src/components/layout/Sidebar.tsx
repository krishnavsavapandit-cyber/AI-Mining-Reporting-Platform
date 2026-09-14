import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  FileCheck,
  Landmark,
  ShieldAlert,
  Layers,
  BarChart3,
  Network,
  History,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Cpu,
  Eye,
  Briefcase,
  Compass,
  Lock,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { RoleSwitcher } from '@/components/ui/RoleSwitcher';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export type NavigationTab =
  | 'overview'
  | 'dashboard'
  | 'documents'
  | 'search'
  | 'assistant'
  | 'reports'
  | 'inquiries'
  | 'validation'
  | 'topics'
  | 'analytics'
  | 'agents'
  | 'audit'
  | 'settings'
  | 'help';

export interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  docCount?: number;
  conflictsCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  aiProviderName?: string;
  aiProviderOnline?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
  counter?: number;
  alertBadge?: number;
  requiredRole?: UserRole[];
}

interface NavSection {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  docCount = 0,
  conflictsCount = 0,
  collapsed = false,
  onToggleCollapse,
  aiProviderName = 'Gemini Grounded Engine',
  aiProviderOnline = true,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { role, isPublicViewerAccount, isViewer } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Enterprise Unified 5-Pillar Navigation Structure
  const enterpriseNavSections: NavSection[] = [
    {
      id: 'command',
      label: 'COMMAND CENTER',
      items: [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
        { id: 'overview', label: 'Architecture', shortLabel: 'Architecture', icon: Compass },
      ],
    },
    {
      id: 'operations',
      label: 'OPERATIONS',
      items: [
        { id: 'documents', label: 'Documents', shortLabel: 'Documents', icon: FileText, counter: docCount },
        { id: 'search', label: 'Smart Search', shortLabel: 'Search', icon: Search },
        { id: 'assistant', label: 'AI Copilot', shortLabel: 'Copilot', icon: Bot, requiredRole: ['ANALYST', 'OFFICER', 'ADMIN'] },
      ],
    },
    {
      id: 'intelligence',
      label: 'INTELLIGENCE',
      items: [
        { id: 'agents', label: 'Agent Swarm', shortLabel: 'Agents', icon: Network, requiredRole: ['ANALYST', 'OFFICER', 'ADMIN'] },
        { id: 'validation', label: 'Discrepancies', shortLabel: 'Discrepancies', icon: ShieldAlert, alertBadge: conflictsCount, requiredRole: ['ANALYST', 'OFFICER', 'ADMIN'] },
        { id: 'topics', label: 'Topic Cloud', shortLabel: 'Topics', icon: Layers, requiredRole: ['ANALYST', 'OFFICER', 'ADMIN'] },
        { id: 'analytics', label: 'Analytics & KPIs', shortLabel: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      id: 'governance',
      label: 'REPORTING & GOVERNANCE',
      items: [
        { id: 'reports', label: 'Executive Reports', shortLabel: 'Reports', icon: FileCheck },
        { id: 'inquiries', label: 'Parliament Desk', shortLabel: 'Inquiries', icon: Landmark, requiredRole: ['ANALYST', 'OFFICER', 'ADMIN'] },
        { id: 'audit', label: 'Audit Trail', shortLabel: 'Audit', icon: History },
      ],
    },
    {
      id: 'administration',
      label: 'ADMINISTRATION',
      items: [
        { id: 'settings', label: 'Settings & RBAC', shortLabel: 'Settings', icon: Settings, requiredRole: ['ADMIN'] },
        { id: 'help', label: 'Guidelines & SOPs', shortLabel: 'Help', icon: HelpCircle },
      ],
    },
  ];

  // Role metadata
  const roleMeta: Record<UserRole, { label: string; sub: string; icon: React.ComponentType<{ size?: number }>; color: string; bg: string }> = {
    OFFICER: { label: 'REVIEWING OFFICER', sub: 'Statutory Sign-Off Authority', icon: ShieldCheck, color: 'var(--accent-primary)', bg: 'rgba(16, 185, 129, 0.12)' },
    ANALYST: { label: 'MINING ANALYST', sub: 'Intelligence & Operations', icon: Briefcase, color: 'var(--accent-teal)', bg: 'rgba(20, 184, 166, 0.12)' },
    ADMIN: { label: 'SYSTEM ADMIN', sub: 'Infrastructure & Telemetry', icon: Cpu, color: 'var(--status-warning)', bg: 'rgba(245, 158, 11, 0.12)' },
    VIEWER: {
      label: isPublicViewerAccount ? 'PUBLIC AUDITOR' : 'AUDITOR / VIEWER',
      sub: isPublicViewerAccount ? 'Read-Only Demo Mode' : 'Read-Only Transparency',
      icon: Eye,
      color: 'var(--text-secondary)',
      bg: 'var(--bg-surface-2)',
    },
  };

  const currentRoleMeta = roleMeta[role] || roleMeta.ANALYST;
  const RoleIcon = currentRoleMeta.icon;

  const isTabRestricted = (item: NavItem) => {
    if (!item.requiredRole) return false;
    return !item.requiredRole.includes(role);
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 89,
            backdropFilter: 'blur(4px)',
          }}
          aria-hidden="true"
        />
      )}
      <aside
        className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        role="navigation"
        aria-label="Sidebar Navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          userSelect: 'none',
        }}
      >
        {/* Brand Header */}
        <div
          className="sidebar-brand"
          onClick={() => onSelectTab('overview')}
          title="Go to GeoNexus Overview"
          style={{
            padding: collapsed ? '16px 8px' : '16px 16px 14px',
            cursor: 'pointer',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div className="brand-icon">
            <MiningLogo size={24} />
          </div>
          {!collapsed && (
            <div className="brand-info" style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="brand-title" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  GeoNexus
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-primary)',
                    letterSpacing: '0.04em',
                  }}
                >
                  ENTERPRISE
                </span>
              </div>
              <span className="brand-subtitle" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                <span>COAL INDIA</span> • <span>CMPDI Suite</span>
              </span>
            </div>
          )}
        </div>

        {/* Role Indicator Banner */}
        {!collapsed && (
          <div
            style={{
              margin: '10px 12px 6px',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline-alt)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: currentRoleMeta.bg,
                border: `1px solid ${currentRoleMeta.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentRoleMeta.color,
                flexShrink: 0,
              }}
            >
              <RoleIcon size={13} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: currentRoleMeta.color,
                  letterSpacing: '0.05em',
                }}
              >
                {currentRoleMeta.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentRoleMeta.sub}
              </span>
            </div>
          </div>
        )}

        {/* Role Switcher in Sidebar */}
        {!collapsed && (
          <div style={{ margin: '2px 12px 8px' }}>
            <RoleSwitcher variant="sidebar" />
          </div>
        )}

        {/* Navigation Sections */}
        <div
          className="sidebar-nav-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {enterpriseNavSections.map((section) => {
            const isSectionCollapsed = !!collapsedSections[section.id];
            const hasActiveItem = section.items.some((i) => i.id === activeTab);

            return (
              <div key={section.id} className="nav-group" style={{ marginBottom: 2 }}>
                {!collapsed && (
                  <div
                    onClick={() => toggleSection(section.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px 4px',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.15s ease',
                    }}
                    title={`Click to toggle ${section.label}`}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: hasActiveItem ? 'var(--accent-primary)' : 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {section.label}
                    </span>
                    <ChevronDown
                      size={12}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                )}

                {(!isSectionCollapsed || collapsed) && (
                  <div className="nav-group-items" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {section.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;
                      const restricted = isTabRestricted(item);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (restricted) return;
                            onSelectTab(item.id);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          disabled={restricted}
                          className={`nav-item ${isActive ? 'active' : ''} ${restricted ? 'restricted' : ''}`}
                          title={
                            restricted
                              ? `${item.label} (Access Restricted to authorized roles)`
                              : collapsed
                              ? item.label
                              : undefined
                          }
                          aria-current={isActive ? 'page' : undefined}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: collapsed ? '10px' : '8px 10px',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            borderRadius: 'var(--radius-sm)',
                            border: isActive
                              ? '1px solid rgba(16, 185, 129, 0.35)'
                              : '1px solid transparent',
                            backgroundColor: isActive
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'transparent',
                            color: isActive
                              ? 'var(--text-primary)'
                              : restricted
                              ? 'var(--text-muted)'
                              : 'var(--text-secondary)',
                            opacity: restricted ? 0.45 : 1,
                            cursor: restricted ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            width: '100%',
                            position: 'relative',
                          }}
                        >
                          <IconComponent
                            className="nav-icon"
                            size={16}
                            style={{
                              color: isActive
                                ? 'var(--accent-primary)'
                                : restricted
                                ? 'var(--text-muted)'
                                : 'inherit',
                              flexShrink: 0,
                            }}
                          />

                          {!collapsed && (
                            <span
                              className="nav-label"
                              style={{
                                fontSize: 12,
                                fontWeight: isActive ? 600 : 500,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.shortLabel || item.label}
                            </span>
                          )}

                          {!collapsed && restricted && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '1px 4px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Lock size={9} /> LOCK
                            </span>
                          )}

                          {!collapsed && !restricted && item.counter !== undefined && item.counter > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-surface-3)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-hairline)',
                              }}
                            >
                              {item.counter}
                            </span>
                          )}

                          {!collapsed && !restricted && item.alertBadge !== undefined && item.alertBadge > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--status-warning)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                              }}
                            >
                              {item.alertBadge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Provider Status Card */}
        {!collapsed && !isViewer && (
          <div
            style={{
              margin: '8px 12px 4px',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              className={aiProviderOnline ? 'status-dot status-dot-success' : 'status-dot status-dot-warning'}
              aria-hidden="true"
            />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ACTIVE ENGINE
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {aiProviderName}
              </span>
            </div>
          </div>
        )}

        {/* Collapse Toggle Footer */}
        {onToggleCollapse && (
          <div
            className="sidebar-footer"
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--border-hairline)',
            }}
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              className="collapse-btn"
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 8,
                padding: '6px 8px',
                background: 'transparent',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              {!collapsed && <span style={{ fontSize: 11, fontWeight: 500 }}>Collapse Sidebar</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
