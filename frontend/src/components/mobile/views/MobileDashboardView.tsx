import React, { useState, useEffect } from 'react';
import {
  Database,
  FileText,
  ShieldAlert,
  Play,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NavigationTab } from '@/components/layout/Sidebar';
import {
  analyticsService,
  agentService,
  validationService,
  reportService,
  documentService,
} from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import {
  AnalyticsSummary,
  DiscrepancyIssue,
  ReportRecord,
  DocumentRecord,
} from '@/types';
import { MobileMineCart } from '@/components/mobile/MobileMineCart';

interface MobileDashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onInspectDocument: (id: number) => void;
  onInspectWorkflow?: (id: string) => void;
  onInspectReport: (id: number) => void;
}

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  onNavigate,
  onInspectDocument,
  onInspectReport,
}) => {
  const { role, isOfficer, isViewer } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [issues, setIssues] = useState<DiscrepancyIssue[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [runningDemo, setRunningDemo] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, valRes, repRes, docRes] =
        await Promise.allSettled([
          analyticsService.getSummary(),
          validationService.getIssues('UNRESOLVED'),
          reportService.getReports(),
          documentService.getDocuments({ status: 'PROCESSED' }),
        ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.summary);
      if (valRes.status === 'fulfilled') setIssues(valRes.value.issues || []);
      if (repRes.status === 'fulfilled') setReports(repRes.value.reports || []);
      if (docRes.status === 'fulfilled') setDocuments(docRes.value.documents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading dashboard data';
      toast.error('Dashboard Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reportService.approveReport(reportId, { approved_by: 'Reviewing Officer (Statutory Sign-Off)' });
      toast.success('Report Approved', 'Official sign-off recorded.');
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Approval Error', msg);
    }
  };

  const handleRunDemo = async () => {
    setRunningDemo(true);
    toast.info('Dispatching Demo', 'Running 8-Agent Rajmahal production discrepancy workflow...');
    try {
      await agentService.runRajmahalDemo();
      toast.success('Demo Complete', 'Cross-document investigation executed and quality audited.');
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo run failed';
      toast.error('Workflow Execution Error', msg);
    } finally {
      setRunningDemo(false);
    }
  };

  const unapprovedReports = reports.filter((r) => !r.human_approved);

  return (
    <div className="mobile-main-viewport">
      {/* 1. Header Banner & Refresh */}
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
            Executive Command Center
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Role: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{role}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* 2. Key KPI Metric Pills */}
      <div className="mobile-metrics-grid">
        <div className="mobile-metric-pill" onClick={() => onNavigate('analytics')}>
          <span className="mobile-metric-label">
            <Database size={13} style={{ color: 'var(--accent-primary)' }} /> Coal Production
          </span>
          <span className="mobile-metric-value" style={{ color: 'var(--accent-primary)' }}>
            {summary?.total_production_mt ?? '0.00'}
          </span>
          <span className="mobile-metric-sub">Million Tonnes Extracted</span>
        </div>

        <div className="mobile-metric-pill" onClick={() => onNavigate('documents')}>
          <span className="mobile-metric-label">
            <FileText size={13} style={{ color: 'var(--accent-teal)' }} /> Audited Docs
          </span>
          <span className="mobile-metric-value">
            {summary?.total_documents ?? documents.length}
          </span>
          <span className="mobile-metric-sub">{summary?.total_pages ?? 0} total pages</span>
        </div>

        <div className="mobile-metric-pill" onClick={() => onNavigate('validation')}>
          <span className="mobile-metric-label">
            <ShieldAlert size={13} style={{ color: 'var(--status-error)' }} /> Discrepancies
          </span>
          <span className="mobile-metric-value" style={{ color: issues.length > 0 ? '#EF4444' : '#10B981' }}>
            {issues.length}
          </span>
          <span className="mobile-metric-sub">{issues.length > 0 ? 'Cross-doc conflicts' : 'Zero conflicts'}</span>
        </div>

        <div className="mobile-metric-pill" onClick={() => onNavigate('agents')}>
          <span className="mobile-metric-label">
            <Cpu size={13} style={{ color: '#A78BFA' }} /> Active Agents
          </span>
          <span className="mobile-metric-value" style={{ color: '#A78BFA' }}>
            8
          </span>
          <span className="mobile-metric-sub">Manager-Worker DAG</span>
        </div>
      </div>

      {/* 3. SIGNATURE MOBILE MINE CART */}
      <MobileMineCart onSelectStageAction={() => onNavigate('agents')} />

      {/* 4. Priority Role Sections */}
      {/* A. OFFICER PERSPECTIVE: Approvals Queue */}
      {isOfficer && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <div>
              <h3 className="mobile-card-title">Statutory Sign-Off Queue</h3>
              <p className="mobile-card-subtitle">Officer approval required for release</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
              }}
            >
              All <ArrowRight size={12} />
            </button>
          </div>

          {unapprovedReports.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              ✓ All statutory executive reports sealed and approved.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unapprovedReports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onInspectReport(rep.id)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rep.title}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#F59E0B',
                      }}
                    >
                      DRAFT
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {rep.subsidiary} • {rep.reporting_period}
                  </div>
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-primary"
                    onClick={(e) => handleApproveReport(rep.id, e)}
                    style={{ height: 32, fontSize: 11 }}
                  >
                    <CheckCircle2 size={13} /> Approve & Seal
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* B. ANALYST PERSPECTIVE: Quick Action & Discrepancies */}
      {!isViewer && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <div>
              <h3 className="mobile-card-title">Autonomous Discrepancy DAG</h3>
              <p className="mobile-card-subtitle">Cross-document verification pipeline</p>
            </div>
          </div>

          <button
            type="button"
            className="mobile-btn-touch mobile-btn-primary"
            onClick={handleRunDemo}
            disabled={runningDemo}
          >
            <Play size={14} className={runningDemo ? 'animate-spin' : ''} />
            {runningDemo ? 'Running 8-Agent Workflow...' : 'Run Rajmahal Discrepancy DAG'}
          </button>
        </div>
      )}

      {/* C. Priority Discrepancy Stream */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div>
            <h3 className="mobile-card-title">Active Discrepancy Alerts</h3>
            <p className="mobile-card-subtitle">Numerical variances across documents</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('validation')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
            }}
          >
            Matrix <ArrowRight size={12} />
          </button>
        </div>

        {issues.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            ✓ Zero unresolved production discrepancies detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {issues.slice(0, 3).map((iss) => (
              <div
                key={iss.id}
                onClick={() => onNavigate('validation')}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {iss.field_name || 'Production Variance'}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                    }}
                  >
                    {iss.variance_percentage ? `${iss.variance_percentage}%` : 'CONFLICT'}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {iss.doc_a_name} ({iss.doc_a_value}) vs {iss.doc_b_name} ({iss.doc_b_value})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* D. Recent Documents */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div>
            <h3 className="mobile-card-title">Recent Ingested Documents</h3>
            <p className="mobile-card-subtitle">Verified OCR & strata facts</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('documents')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
            }}
          >
            All Docs <ArrowRight size={12} />
          </button>
        </div>

        {documents.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No documents processed yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                onClick={() => onInspectDocument(doc.id)}
                style={{
                  padding: '9px 11px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <FileText size={15} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {doc.original_name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {doc.subsidiary} • {doc.page_count} Pages
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    flexShrink: 0,
                  }}
                >
                  OK
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
