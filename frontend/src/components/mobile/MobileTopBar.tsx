import React from 'react';
import { Menu } from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { NavigationTab } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/ui/RoleSwitcher';

interface MobileTopBarProps {
  activeTab: NavigationTab;
  onOpenMenu: () => void;
  onOpenUpload?: () => void;
  onQuickSeed?: () => void;
  isSeeding?: boolean;
  dbConnected?: boolean;
  docCount?: number;
  conflictsCount?: number;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  overview: { title: 'Platform Overview', subtitle: 'Architecture & Engine' },
  dashboard: { title: 'Executive Command', subtitle: 'Operational Telemetry' },
  documents: { title: 'Document Center', subtitle: 'OCR & Stratigraphy' },
  search: { title: 'Hybrid Search', subtitle: 'TF-IDF + Cosine RRF' },
  assistant: { title: 'Mining Assistant', subtitle: 'Grounded Intelligence' },
  reports: { title: 'Statutory Reports', subtitle: 'Executive Approvals' },
  inquiries: { title: 'Parliamentary Inquiries', subtitle: 'Ministry Responses' },
  validation: { title: 'Discrepancy Matrix', subtitle: 'Variance Audit' },
  topics: { title: 'Topic Discovery', subtitle: 'Geological Clusters' },
  analytics: { title: 'Mining Analytics', subtitle: 'ISO/IEC 25010 Metrics' },
  agents: { title: '8-Agent Workflow', subtitle: 'Autonomous DAG' },
  audit: { title: 'Audit Trail', subtitle: 'Immutable Provenance' },
  settings: { title: 'System Health', subtitle: 'AI & DB Engine' },
  help: { title: 'Domain SOPs', subtitle: 'DGMS & CIL Standards' },
};

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  activeTab,
  onOpenMenu,
  dbConnected = true,
}) => {
  const currentTab = TAB_TITLES[activeTab] || { title: 'GeoNexus', subtitle: 'Mining Intelligence' };

  return (
    <header className="mobile-topbar" id="mobile-header">
      {/* Left: Hamburger & Brand + Current Title */}
      <div className="mobile-topbar-left">
        <button
          type="button"
          onClick={onOpenMenu}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minWidth: '36px',
            minHeight: '36px',
          }}
          aria-label="Open Navigation Drawer"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <MiningLogo size={22} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="mobile-header-title">{currentTab.title}</span>
            </div>
            <span className="mobile-header-subtitle">{currentTab.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Right: Telemetry pill & Quick Action */}
      <div className="mobile-topbar-right">
        {/* DB Connection Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 7px',
            backgroundColor: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '6px',
            fontSize: '10px',
            color: 'var(--text-secondary)',
          }}
          title={dbConnected ? 'Database Connected' : 'Database Offline'}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: dbConnected ? '#10B981' : '#EF4444',
              boxShadow: dbConnected ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none',
              display: 'inline-block',
            }}
          />
          <span className="text-mono" style={{ fontSize: '10px', fontWeight: 600 }}>
            DB
          </span>
        </div>

        {/* Role perspective quick badge */}
        <RoleSwitcher />
      </div>
    </header>
  );
};
