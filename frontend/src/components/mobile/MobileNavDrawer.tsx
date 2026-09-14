import React from 'react';
import {
  X,
  LayoutDashboard,
  FileText,
  Network,
  Layers,
  Search,
  Bot,
  ShieldAlert,
  FileCheck,
  Landmark,
  History,
  BarChart3,
  Settings,
  HelpCircle,
  Compass,
  LogOut,
  Upload,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { MiningLogo } from '@/components/ui/MiningLogo';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  docCount?: number;
  conflictsCount?: number;
  onOpenUpload?: () => void;
  onQuickSeed?: () => void;
  isSeeding?: boolean;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  docCount = 0,
  conflictsCount = 0,
  onOpenUpload,
  onQuickSeed,
  isSeeding = false,
}) => {
  const { user, role, logout, isViewer, isAdmin, isAnalyst } = useAuth();

  if (!isOpen) return null;

  const handleItemClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const VIEWER_ALLOWED: NavigationTab[] = [
    'overview',
    'dashboard',
    'reports',
    'documents',
    'analytics',
    'audit',
    'help',
  ];

  const renderNavButton = (
    tab: NavigationTab,
    label: string,
    Icon: React.ComponentType<{ size?: number; className?: string }>,
    badge?: number | string,
    badgeVariant?: 'error' | 'teal' | 'warning'
  ) => {
    const isRestricted = isViewer && !VIEWER_ALLOWED.includes(tab);
    const isActive = activeTab === tab;

    return (
      <button
        key={tab}
        type="button"
        className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
        onClick={() => !isRestricted && handleItemClick(tab)}
        disabled={isRestricted}
        style={{
          opacity: isRestricted ? 0.45 : 1,
          cursor: isRestricted ? 'not-allowed' : 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={16} />
          </div>
          <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isRestricted ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              RESTRICTED
            </span>
          ) : badge !== undefined && badge !== 0 ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 10,
                backgroundColor:
                  badgeVariant === 'error'
                    ? 'var(--status-error)'
                    : badgeVariant === 'teal'
                    ? 'var(--accent-teal)'
                    : 'var(--accent-primary)',
                color: '#FFFFFF',
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
      </button>
    );
  };

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-drawer-handle" />

        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MiningLogo size={24} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>GeoNexus</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {user?.name || 'Authorized Personnel'} • <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{role}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              padding: 6,
              cursor: 'pointer',
            }}
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="mobile-drawer-content">
          {/* Quick Actions (Role-Adaptive) */}
          <div style={{ display: 'flex', gap: 8 }}>
            {isAnalyst && onOpenUpload && (
              <button
                type="button"
                className="mobile-btn-touch mobile-btn-primary"
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                style={{ height: 38, fontSize: 12 }}
              >
                <Upload size={14} /> Upload Report
              </button>
            )}

            {isAdmin && onQuickSeed && (
              <button
                type="button"
                className="mobile-btn-touch mobile-btn-secondary"
                onClick={() => {
                  onClose();
                  onQuickSeed();
                }}
                disabled={isSeeding}
                style={{ height: 38, fontSize: 12 }}
              >
                <Sparkles size={14} style={{ color: 'var(--status-warning)' }} />
                {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
              </button>
            )}
          </div>

          {/* Section 1: OPERATIONS */}
          <div>
            <div className="mobile-drawer-section-title">OPERATIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {renderNavButton('dashboard', 'Dashboard', LayoutDashboard)}
              {renderNavButton('documents', 'Document Center', FileText, docCount > 0 ? docCount : undefined)}
              {renderNavButton('agents', '8-Agent Workflow', Network)}
              {renderNavButton('topics', 'Geological Topics', Layers)}
            </div>
          </div>

          {/* Section 2: INTELLIGENCE */}
          <div>
            <div className="mobile-drawer-section-title">INTELLIGENCE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {renderNavButton('search', 'Hybrid Search', Search)}
              {renderNavButton('assistant', 'Mining Assistant', Bot)}
              {renderNavButton(
                'validation',
                'Discrepancy Matrix',
                ShieldAlert,
                conflictsCount > 0 ? conflictsCount : undefined,
                'error'
              )}
            </div>
          </div>

          {/* Section 3: REPORTING & GOVERNANCE */}
          <div>
            <div className="mobile-drawer-section-title">REPORTING & GOVERNANCE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {renderNavButton('reports', 'Statutory Reports', FileCheck)}
              {renderNavButton('inquiries', 'Parliamentary Inquiries', Landmark)}
              {renderNavButton('audit', 'Audit Provenance Trail', History)}
            </div>
          </div>

          {/* Section 4: ADMINISTRATION & GUIDES */}
          <div>
            <div className="mobile-drawer-section-title">ADMINISTRATION & GUIDES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {renderNavButton('analytics', 'Mining Analytics', BarChart3)}
              {renderNavButton('settings', 'System Health & Settings', Settings)}
              {renderNavButton('help', 'CIL Domain SOPs', HelpCircle)}
              {renderNavButton('overview', 'Platform Overview', Compass)}
            </div>
          </div>

          {/* User Session & Logout */}
          <div
            style={{
              paddingTop: 12,
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-outline"
              onClick={handleLogout}
              style={{ color: 'var(--status-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
