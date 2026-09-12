import React from 'react';
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
  ShieldCheck,
  Cpu,
  Eye,
  Briefcase,
  Compass,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
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
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  counter?: number;
  alertBadge?: number;
}

interface NavSection {
  label: string;
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
}) => {
  const { role, setRole } = useAuth();

  // Role-specific navigation definitions
  const getNavSectionsForRole = (currentRole: UserRole): NavSection[] => {
    switch (currentRole) {
      case 'OFFICER':
        return [
          {
            label: 'Platform Views',
            items: [
              { id: 'overview', label: 'GeoNexus Overview', icon: Compass },
            ],
          },
          {
            label: 'Statutory Governance',
            items: [
              { id: 'dashboard', label: 'Governance Command & Queue', icon: LayoutDashboard },
              { id: 'reports', label: 'Executive Reports (Sign-Off)', icon: FileCheck },
              { id: 'inquiries', label: 'Parliamentary Questions', icon: Landmark },
              { id: 'validation', label: 'Discrepancy Decisions', icon: ShieldAlert, alertBadge: conflictsCount },
            ],
          },
          {
            label: 'Evidence & Verification',
            items: [
              { id: 'documents', label: 'Audited Ingested Catalog', icon: FileText, counter: docCount },
              { id: 'search', label: 'Provenance Fact Search', icon: Search },
            ],
          },
          {
            label: 'Statutory Records',
            items: [
              { id: 'audit', label: 'Officer Sign-Off Log', icon: History },
              { id: 'help', label: 'Joint Secretary SOPs', icon: HelpCircle },
            ],
          },
        ];

      case 'ADMIN':
        return [
          {
            label: 'Platform Views',
            items: [
              { id: 'overview', label: 'GeoNexus Overview', icon: Compass },
            ],
          },
          {
            label: 'System Administration',
            items: [
              { id: 'dashboard', label: 'Infrastructure Health HUD', icon: LayoutDashboard },
              { id: 'agents', label: '8-Agent Worker Concurrency', icon: Network },
              { id: 'settings', label: 'Engine & Database Config', icon: Settings },
              { id: 'audit', label: 'Full System Audit Trail', icon: History },
            ],
          },
          {
            label: 'Data & Benchmarking',
            items: [
              { id: 'documents', label: 'Repository Administration', icon: FileText, counter: docCount },
              { id: 'validation', label: 'Conflict Registry', icon: ShieldAlert, alertBadge: conflictsCount },
              { id: 'analytics', label: 'ISO/IEC 25010 Benchmarks', icon: BarChart3 },
            ],
          },
          {
            label: 'Platform Architecture',
            items: [
              { id: 'help', label: 'System Architecture & Specs', icon: HelpCircle },
            ],
          },
        ];

      case 'VIEWER':
        return [
          {
            label: 'Platform Views',
            items: [
              { id: 'overview', label: 'GeoNexus Overview', icon: Compass },
            ],
          },
          {
            label: 'Auditor Perspective',
            items: [
              { id: 'dashboard', label: 'Executive Compliance Summary', icon: LayoutDashboard },
              { id: 'reports', label: 'Certified Published Reports', icon: FileCheck },
              { id: 'documents', label: 'Audited Document Catalog', icon: FileText, counter: docCount },
              { id: 'analytics', label: 'Statutory Mining Metrics', icon: BarChart3 },
              { id: 'audit', label: 'Immutable Provenance Trail', icon: History },
              { id: 'help', label: 'Public Transparency Guide', icon: HelpCircle },
            ],
          },
        ];

      case 'ANALYST':
      default:
        return [
          {
            label: 'Platform Views',
            items: [
              { id: 'overview', label: 'GeoNexus Overview', icon: Compass },
            ],
          },
          {
            label: 'Operations & Ingestion',
            items: [
              { id: 'dashboard', label: 'Mining Intelligence Operations', icon: LayoutDashboard },
              { id: 'agents', label: '8-Agent Orchestration Graph', icon: Network },
              { id: 'documents', label: 'Document Ingestion & OCR', icon: FileText, counter: docCount },
            ],
          },
          {
            label: 'Intelligence Discovery',
            items: [
              { id: 'topics', label: 'Topics & Strata Word Cloud', icon: Layers },
              { id: 'analytics', label: 'Mining Analytics & DGMS', icon: BarChart3 },
              { id: 'validation', label: 'Discrepancy Anomaly Center', icon: ShieldAlert, alertBadge: conflictsCount },
              { id: 'search', label: 'Hybrid Semantic Search', icon: Search },
              { id: 'assistant', label: 'Grounded Mining Assistant', icon: Bot },
              { id: 'reports', label: 'Draft Report Generator', icon: FileCheck },
            ],
          },
          {
            label: 'Domain Standards',
            items: [
              { id: 'help', label: 'CIL Domain SOPs & Guides', icon: HelpCircle },
            ],
          },
        ];
    }
  };

  const navSections = getNavSectionsForRole(role);

  // Role metadata
  const roleMeta: Record<UserRole, { label: string; sub: string; icon: React.ComponentType<{ size?: number }>; color: string; bg: string }> = {
    OFFICER: { label: 'REVIEWING OFFICER', sub: 'Statutory Sign-Off Authority', icon: ShieldCheck, color: 'var(--accent-primary)', bg: 'rgba(16, 185, 129, 0.12)' },
    ANALYST: { label: 'MINING ANALYST', sub: 'Intelligence & Discovery', icon: Briefcase, color: 'var(--accent-teal)', bg: 'rgba(20, 184, 166, 0.12)' },
    ADMIN: { label: 'SYSTEM ADMIN', sub: 'Infrastructure & Telemetry', icon: Cpu, color: 'var(--status-warning)', bg: 'rgba(245, 158, 11, 0.12)' },
    VIEWER: { label: 'AUDITOR / VIEWER', sub: 'Read-Only Transparency', icon: Eye, color: 'var(--text-secondary)', bg: 'var(--bg-surface-2)' },
  };

  const currentRoleMeta = roleMeta[role] || roleMeta.ANALYST;
  const RoleIcon = currentRoleMeta.icon;

  return (
    <aside
      className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}
      role="navigation"
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div
        className="sidebar-brand"
        onClick={() => onSelectTab('overview')}
        title="Go to GeoNexus Overview"
      >
        <div className="brand-icon">
          <MiningLogo size={22} />
        </div>
        {!collapsed && (
          <div className="brand-info">
            <span className="brand-title">GeoNexus</span>
            <span className="brand-subtitle">
              <span>COAL INDIA</span> • <span>CMPDI Intelligence Suite</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
        <div
          style={{
            margin: '2px 12px 8px',
            padding: '4px 6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', paddingLeft: 4, letterSpacing: '0.04em' }}>
            ROLE PERSPECTIVE
          </span>
          <select
            value={role}
            onChange={(e) => {
              const newRole = e.target.value.toUpperCase() as UserRole;
              setRole(newRole);
              const allowedTabs = getNavSectionsForRole(newRole).flatMap((s) => s.items.map((i) => i.id));
              if (activeTab !== 'overview' && !allowedTabs.includes(activeTab)) {
                onSelectTab('dashboard');
              }
            }}
            aria-label="Switch Role Perspective"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ANALYST">Analyst (Mining)</option>
            <option value="OFFICER">Officer (Sign-Off)</option>
            <option value="ADMIN">Admin (System)</option>
            <option value="VIEWER">Viewer (Auditor)</option>
          </select>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className="nav-group" style={{ marginTop: sIdx === 0 ? 2 : 14 }}>
            {!collapsed && <span className="nav-group-title">{section.label}</span>}
            <div className="nav-group-items">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <IconComponent className="nav-icon" size={16} />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                    {!collapsed && item.counter !== undefined && item.counter > 0 && (
                      <span className="nav-counter">{item.counter}</span>
                    )}
                    {!collapsed && item.alertBadge !== undefined && item.alertBadge > 0 && (
                      <span className="nav-badge-alert">{item.alertBadge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Provider Status Card */}
      {!collapsed && role !== 'VIEWER' && (
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
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ACTIVE ENGINE
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
              className="truncate"
            >
              {aiProviderName}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle Footer */}
      {onToggleCollapse && (
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="collapse-btn"
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span style={{ fontSize: 12 }}>Collapse Navigation</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
