import React from 'react';
import {
  Upload,
  Database,
  ShieldCheck,
  Sparkles,
  Lock,
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
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Command Center', subtitle: 'Platform overview & telemetry' },
  documents: { title: 'Document Intelligence Ingestion', subtitle: 'Indexed statutory CIL files & OCR' },
  search: { title: 'Hybrid Semantic & Vector Search', subtitle: 'Sublinear TF-IDF + Cosine RRF' },
  assistant: { title: 'Mining Intelligence Assistant', subtitle: 'Grounded RAG with strict zero-hallucination' },
  reports: { title: 'Executive Report Generator', subtitle: 'Multi-source document compilation & approval' },
  inquiries: { title: 'Parliamentary Question Formulation', subtitle: 'Ministry of Coal starred inquiry drafts' },
  validation: { title: 'Discrepancy Resolution Matrix', subtitle: 'Cross-document variance audit' },
  topics: { title: 'Geological & Mining Topic Discovery', subtitle: 'TF-IDF clusters & strata word cloud' },
  analytics: { title: 'Mining Analytics & ISO/IEC 25010', subtitle: 'Empirical measurement methodology' },
  agents: { title: '8-Agent Multi-Agent Orchestration', subtitle: 'Manager-worker DAG concurrency' },
  audit: { title: 'Immutable Audit Trail & Provenance', subtitle: 'SHA-256 verified action history' },
  settings: { title: 'System Configuration & Health', subtitle: 'AI provider endpoints & database' },
  help: { title: 'Mining Intelligence SOPs & Standards', subtitle: 'DGMS & statutory compliance guidelines' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenUpload,
  onQuickSeed,
  isSeeding = false,
  dbConnected = true,
}) => {
  const { isOfficer, isAnalyst, isAdmin, isViewer } = useAuth();
  const currentTab = TAB_TITLES[activeTab] || { title: 'Mining Platform', subtitle: 'CMPDI Suite' };

  return (
    <header className="app-topbar">
      {/* Left: Breadcrumbs & Current Page Title */}
      <div className="topbar-left">
        <div className="breadcrumb-section">
          <span className="breadcrumb-root">CIL / CMPDI</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{currentTab.title}</span>
        </div>
      </div>

      {/* Right: Role Switcher & Role-Specific Controls */}
      <div className="topbar-right">
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
            Upload Ingestion File
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
