import React from 'react';
import {
  Upload,
  Sparkles,
  Menu,
  FileText,
  Network,
  Bot,
  FileCheck,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleSwitcher } from '@/components/ui/RoleSwitcher';
import { NavigationTab } from './Sidebar';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  activeTab: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenUpload?: () => void;
  onQuickSeed?: () => void;
  onOpenAiHealth?: () => void;
  isSeeding?: boolean;
  dbConnected?: boolean;
  aiProviderName?: string;
  aiProviderOnline?: boolean;
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
  onNavigate,
  onOpenUpload,
  onOpenAiHealth,
  aiProviderName = 'Deterministic Grounded Engine',
  aiProviderOnline = true,
  onToggleMobileSidebar,
}) => {
  const { isViewer } = useAuth();
  const currentTab = TAB_METADATA[activeTab] || {
    section: 'COMMAND CENTER',
    title: 'GeoNexus Mining Intelligence',
    subtitle: 'Enterprise Operating Environment',
  };

  const isGemini = aiProviderName?.toLowerCase().includes('gemini');

  return (
    <header className="app-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 18px', borderBottom: '1px solid var(--border-hairline)' }}>
      {/* Left: Mobile Toggle, Breadcrumbs & Current Page Title */}
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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

      {/* Center: Clean 4-Step Pipeline Quick Navigation Strip */}
      {onNavigate && (
        <nav
          className="topbar-pipeline-strip"
          aria-label="Workflow pipeline steps"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '3px 6px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
          }}
        >
          <button
            type="button"
            onClick={() => onNavigate('documents')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeTab === 'documents' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'documents' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'documents' ? 700 : 500,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
            title="Step 1: Upload mining reports & OCR"
          >
            <FileText size={11} />
            <span>1. Upload</span>
          </button>

          <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>/</span>

          <button
            type="button"
            onClick={() => onNavigate('agents')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeTab === 'agents' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'agents' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'agents' ? 700 : 500,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
            title="Step 2: 8-Agent Swarm DAG & worker telemetry"
          >
            <Network size={11} />
            <span>2. 8-Agent Swarm</span>
          </button>

          <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>/</span>

          <button
            type="button"
            onClick={() => onNavigate('assistant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeTab === 'assistant' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'assistant' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'assistant' ? 700 : 500,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
            title="Step 3: Grounded AI Copilot Q&A"
          >
            <Bot size={11} />
            <span>3. Copilot</span>
          </button>

          <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>/</span>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeTab === 'reports' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'reports' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'reports' ? 700 : 500,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
            title="Step 4: Executive synthesis & sign-off"
          >
            <FileCheck size={11} />
            <span>4. Reports</span>
          </button>
        </nav>
      )}

      {/* Right: AI Engine Status, Role Switcher & Upload */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Clickable AI Engine Health Pill */}
        <button
          type="button"
          onClick={onOpenAiHealth}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            backgroundColor: aiProviderOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${aiProviderOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 11,
            color: aiProviderOnline ? 'var(--status-success)' : 'var(--status-warning)',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          title="Click to switch AI Engine (Gemini / Ollama / Deterministic)"
        >
          {isGemini ? <Sparkles size={11} /> : <Cpu size={11} />}
          <span>{isGemini ? 'Gemini: Live' : 'AI: Deterministic'}</span>
        </button>

        {/* Role Perspective Dropdown Selector */}
        <RoleSwitcher />

        {/* Quick Upload Button */}
        {!isViewer && onOpenUpload && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenUpload}
            icon={<Upload size={12} />}
          >
            Upload
          </Button>
        )}
      </div>
    </header>
  );
};
