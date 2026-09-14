import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Network,
  FileCheck,
  Menu,
} from 'lucide-react';
import { NavigationTab } from '@/components/layout/Sidebar';

interface MobileBottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMore: () => void;
  docCount?: number;
  conflictsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore,
  docCount = 0,
  conflictsCount = 0,
}) => {
  const isHomeActive = activeTab === 'dashboard' || activeTab === 'overview';
  const isDocsActive = activeTab === 'documents';
  const isWorkflowActive = activeTab === 'agents';
  const isReportsActive = activeTab === 'reports';
  const isMoreActive = !isHomeActive && !isDocsActive && !isWorkflowActive && !isReportsActive;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Home / Dashboard */}
      <button
        type="button"
        className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`}
        onClick={() => onSelectTab('dashboard')}
        aria-label="Dashboard"
      >
        <div className="mobile-nav-icon-wrapper">
          <LayoutDashboard size={18} />
        </div>
        <span>Home</span>
      </button>

      {/* 2. Documents */}
      <button
        type="button"
        className={`mobile-nav-item ${isDocsActive ? 'active' : ''}`}
        onClick={() => onSelectTab('documents')}
        aria-label="Documents"
      >
        <div className="mobile-nav-icon-wrapper">
          <FileText size={18} />
          {docCount > 0 && <span className="mobile-nav-badge">{docCount > 99 ? '99+' : docCount}</span>}
        </div>
        <span>Docs</span>
      </button>

      {/* 3. Workflow & Mine Cart */}
      <button
        type="button"
        className={`mobile-nav-item ${isWorkflowActive ? 'active' : ''}`}
        onClick={() => onSelectTab('agents')}
        aria-label="Workflow & Mine Cart"
      >
        <div className="mobile-nav-icon-wrapper">
          <Network size={18} />
        </div>
        <span>Workflow</span>
      </button>

      {/* 4. Statutory Reports */}
      <button
        type="button"
        className={`mobile-nav-item ${isReportsActive ? 'active' : ''}`}
        onClick={() => onSelectTab('reports')}
        aria-label="Reports"
      >
        <div className="mobile-nav-icon-wrapper">
          <FileCheck size={18} />
        </div>
        <span>Reports</span>
      </button>

      {/* 5. More Menu */}
      <button
        type="button"
        className={`mobile-nav-item ${isMoreActive ? 'active' : ''}`}
        onClick={onOpenMore}
        aria-label="More Features"
      >
        <div className="mobile-nav-icon-wrapper">
          <Menu size={18} />
          {conflictsCount > 0 && <span className="mobile-nav-badge">{conflictsCount}</span>}
        </div>
        <span>More</span>
      </button>
    </nav>
  );
};
