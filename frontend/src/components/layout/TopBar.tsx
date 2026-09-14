import React from 'react';
import {
  Upload,
  Database,
  ShieldCheck,
  Sparkles,
  Lock,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RoleSwitcher } from '@/components/ui/RoleSwitcher';
import { NavigationTab } from './Sidebar';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  activeTab: NavigationTab;
  onOpenUpload?: () => void;
  onQuickSeed?: () => void;
  isSeeding?: boolean;
  dbConnected?: boolean;
  onToggleMobileSidebar?: () => void;
}

interface TabMeta {
  section: string;
  title: string;
  subtitle: string;
}

const TAB_METADATA: Record<NavigationTab, TabMeta> = {
  overview: { section: 'COMMAND CENTER', title: 'Architecture', subtitle: 'Distributed multi-agent pipeline & system blueprints' },
  dashboard: { section: 'COMMAND CENTER', title: 'Dashboard', subtitle: 'Platform overview & real-time operational telemetry' },
  documents: { section: 'OPERATIONS', title: 'Documents', subtitle: 'Statutory CIL files, OCR & vector embeddings' },
  search: { section: 'OPERATIONS', title: 'Smart Search', subtitle: 'Hybrid TF-IDF & vector semantic search' },
  assistant: { section: 'OPERATIONS', title: 'AI Copilot', subtitle: 'Evidence-grounded mining intelligence chat' },
  reports: { section: 'REPORTING & GOVERNANCE', title: 'Executive Reports', subtitle: 'Multi-source document synthesis & statutory sign-off' },
  inquiries: { section: 'REPORTING & GOVERNANCE', title: 'Parliament Desk', subtitle: 'Parliamentary questions & Ministry of Coal response drafts' },
  validation: { section: 'INTELLIGENCE', title: 'Discrepancies', subtitle: 'Cross-document conflict registry & variance detection' },
  topics: { section: 'INTELLIGENCE', title: 'Topic Cloud', subtitle: 'Keyword strata topic discovery & term distributions' },
  analytics: { section: 'INTELLIGENCE', title: 'Analytics & KPIs', subtitle: 'Operational metrics & ISO/IEC 25010 benchmarks' },
  agents: { section: 'INTELLIGENCE', title: 'Agent Swarm', subtitle: '8-Agent manager-worker pipeline concurrency' },
  audit: { section: 'REPORTING & GOVERNANCE', title: 'Audit Trail', subtitle: 'SHA-256 cryptographically verified audit events' },
  settings: { section: 'ADMINISTRATION', title: 'Settings & RBAC', subtitle: 'AI providers, model parameters & system health' },
  help: { section: 'ADMINISTRATION', title: 'Guidelines & SOPs', subtitle: 'DGMS safety compliance & Reviewing Officer protocols' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenUpload,
  onQuickSeed,
  isSeeding = false,
  dbConnected = true,
  onToggleMobileSidebar,
}) => {
  const { isOfficer, isAnalyst, isAdmin, isViewer } = useAuth();
  const currentTab = TAB_METADATA[activeTab] || {
    section: 'COMMAND CENTER',
    title: 'GeoNexus Mining Intelligence',
    subtitle: 'Enterprise Operating Environment',
  };

  return (
    <header className="app-topbar">
      {/* Left: Mobile Toggle, Breadcrumbs & Current Page Title */}
      <div className="topbar-left">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="mobile-nav-toggle-btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-hairline-alt)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '6px',
              cursor: 'pointer',
              display: 'none',
            }}
            aria-label="Toggle navigation menu"
          >
            <Menu size={16} />
          </button>
        )}
        <div className="breadcrumb-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="breadcrumb-root" style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>
            GeoNexus
          </span>
          <span className="breadcrumb-sep" style={{ color: 'var(--text-muted)' }}>/</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {currentTab.section}
          </span>
          <span className="breadcrumb-sep" style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="breadcrumb-current" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {currentTab.title}
          </span>
        </div>
      </div>

      {/* Right: Role Switcher & Role-Specific Controls */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Database Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <Database size={13} style={{ color: dbConnected ? 'var(--accent-primary)' : 'var(--status-error)' }} />
          <span className="text-mono" style={{ fontSize: '11px' }}>
            {dbConnected ? 'SQLite Live' : 'DB Disconnected'}
          </span>
        </div>

        {/* Role Perspective Dropdown Selector */}
        <RoleSwitcher />

        {/* Role-Specific Action Controls */}
        {isViewer && (
          <Badge variant="slate" icon={<Lock size={11} />}>
            READ-ONLY MODE
          </Badge>
        )}

        {isOfficer && (
          <Badge variant="primary" icon={<ShieldCheck size={11} />}>
            STATUTORY SIGN-OFF READY
          </Badge>
        )}

        {isAnalyst && onOpenUpload && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenUpload}
            icon={<Upload size={13} />}
          >
            Upload File
          </Button>
        )}

        {isAdmin && onQuickSeed && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onQuickSeed}
            loading={isSeeding}
            icon={<Sparkles size={13} style={{ color: 'var(--status-warning)' }} />}
          >
            Seed Demo Files
          </Button>
        )}
      </div>
    </header>
  );
};
