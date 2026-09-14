import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Landmark,
  ShieldAlert,
  FileText,
  Search,
  ArrowRight,
  RefreshCw,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { QualityGateHero } from '@/components/ui/QualityGateHero';
import { WorkflowTimelineGraph } from '@/components/agents/WorkflowTimelineGraph';
import { useAuth } from '@/context/AuthContext';
import { NavigationTab } from '@/components/layout/Sidebar';
import {
  analyticsService,
  agentService,
  validationService,
  reportService,
  inquiryService,
  documentService,
} from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import {
  AnalyticsSummary,
  Agent,
  WorkflowRecord,
  DiscrepancyIssue,
  ReportRecord,
  InquiryRecord,
  DocumentRecord,
} from '@/types';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onInspectDocument?: (id: number) => void;
  onInspectWorkflow?: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onInspectDocument,
  onInspectWorkflow,
}) => {
  const { role, isOfficer, isAdmin, isViewer, canApprove } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [issues, setIssues] = useState<DiscrepancyIssue[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [runningDemo, setRunningDemo] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, agentsRes, wfRes, valRes, repRes, inqRes, docRes] =
        await Promise.allSettled([
          analyticsService.getSummary(),
          agentService.getAgents(),
          agentService.getWorkflows({ limit: 5 }),
          validationService.getIssues('UNRESOLVED'),
          reportService.getReports(),
          inquiryService.getInquiries(),
          documentService.getDocuments({ status: 'PROCESSED' }),
        ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.summary);
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.agents || []);
      if (wfRes.status === 'fulfilled') setWorkflows(wfRes.value.workflows || []);
      if (valRes.status === 'fulfilled') setIssues(valRes.value.issues || []);
      if (repRes.status === 'fulfilled') setReports(repRes.value.reports || []);
      if (inqRes.status === 'fulfilled') setInquiries(inqRes.value.inquiries || []);
      if (docRes.status === 'fulfilled') setDocuments(docRes.value.documents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading dashboard data';
      toast.error('Dashboard Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportId: number) => {
    try {
      await reportService.approveReport(reportId, { approved_by: 'Reviewing Officer (Statutory Sign-Off)' });
      toast.success('Report Approved', 'Official sign-off recorded in immutable audit trail.');
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Approval Error', msg);
    }
  };

  const handleApproveInquiry = async (inquiryId: number) => {
    try {
      await inquiryService.approveInquiry(inquiryId, { approved_by: 'Reviewing Officer / JS' });
      toast.success('Inquiry Approved', 'Parliamentary answer authorized for submission.');
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Inquiry Approval Error', msg);
    }
  };

  const handleRunDemo = async () => {
    setRunningDemo(true);
    toast.info('Dispatching Multi-Agent DAG', 'Executing Rajmahal production discrepancy workflow...');
    try {
      await agentService.runRajmahalDemo();
      toast.success('Demo DAG Complete', 'Cross-document investigation executed and quality audited.');
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo run failed';
      toast.error('Workflow Execution Error', msg);
    } finally {
      setRunningDemo(false);
    }
  };

  const unapprovedReports = reports.filter((r) => !r.human_approved);
  const unapprovedInquiries = inquiries.filter((i) => !i.human_approved);
  const criticalIssues = issues.filter((iss) => iss.severity === 'HIGH' || (iss.variance_percentage && iss.variance_percentage > 10));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Command Header */}
      <div
        style={{
          padding: '18px 24px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline-alt)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-level-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              GeoNexus Executive Command Center
            </h2>
            <Badge variant={isOfficer ? 'primary' : isAdmin ? 'warning' : isViewer ? 'slate' : 'teal'}>
              {role} PERSPECTIVE
            </Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
            Unified operational command: Multi-source document telemetry, 8-agent DAG concurrency, and statutory quality governance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isViewer && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunDemo}
              loading={runningDemo}
              icon={<Play size={13} />}
            >
              Run Rajmahal Discrepancy DAG
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* LEVEL 1: Immediate State Metric HUD */}
      <div className="grid-metrics">
        <MetricCard
          label="Total Coal Production"
          value={summary?.total_production_mt ?? '0.00'}
          unit="Million Tonnes"
          subtitle="Extracted across CIL subsidiaries"
          icon={<Database size={18} />}
          highlight
          level={2}
          onClick={() => onNavigate('analytics')}
        />
        <MetricCard
          label="Audited Documents"
          value={summary?.total_documents ?? documents.length}
          subtitle={`${summary?.total_pages ?? 0} total parsed pages`}
          icon={<FileText size={18} />}
          onClick={() => onNavigate('documents')}
        />
        <MetricCard
          label="Extracted Facts"
          value={summary?.extracted_records ?? 0}
          subtitle="Ground-truth verified entities"
          icon={<Search size={18} />}
          onClick={() => onNavigate('documents')}
        />
        <MetricCard
          label="Flagged Discrepancies"
          value={issues.length}
          subtitle={issues.length > 0 ? `${criticalIssues.length} high-variance conflicts` : 'Zero variance'}
          icon={<ShieldAlert size={18} />}
          highlight={issues.length > 0}
          onClick={() => onNavigate('validation')}
        />
        <MetricCard
          label="Pending Sign-Offs"
          value={unapprovedReports.length + unapprovedInquiries.length}
          subtitle={unapprovedReports.length > 0 ? 'Reports & Inquiries in queue' : 'Zero backlog'}
          icon={<FileCheck size={18} />}
          highlight={unapprovedReports.length + unapprovedInquiries.length > 0}
          onClick={() => onNavigate('reports')}
        />
      </div>

      {/* LEVEL 2: Requires Immediate Attention Section */}
      <div
        style={{
          padding: '20px',
          backgroundColor: unapprovedReports.length > 0 || issues.length > 0 || unapprovedInquiries.length > 0
            ? 'rgba(245, 158, 11, 0.04)'
            : 'var(--bg-surface)',
          border: '1px solid',
          borderColor: unapprovedReports.length > 0 || issues.length > 0 || unapprovedInquiries.length > 0
            ? 'rgba(245, 158, 11, 0.25)'
            : 'var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--status-warning)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em' }}>
              PRIORITY OPERATIONAL QUEUE & ACTION ITEMS
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Progressive Disclosure: Triage high-priority items directly or drill into workspaces
          </span>
        </div>

        {unapprovedReports.length === 0 && issues.length === 0 && unapprovedInquiries.length === 0 ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--accent-primary)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            <span>All statutory invariants satisfied: No critical discrepancies, pending approvals, or unverified inquiries.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {/* Priority Item 1: Unapproved Reports */}
            {unapprovedReports.length > 0 && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileCheck size={15} style={{ color: 'var(--accent-primary)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {unapprovedReports.length} Report(s) Awaiting Sign-Off
                    </strong>
                  </div>
                  <Badge variant="warning">ACTION REQUIRED</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Latest: {unapprovedReports[0].title} ({unapprovedReports[0].subsidiary})
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {canApprove && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveReport(unapprovedReports[0].id)}
                      icon={<CheckCircle2 size={12} />}
                    >
                      Seal Report
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('reports')}
                    icon={<ExternalLink size={12} />}
                  >
                    View All Reports
                  </Button>
                </div>
              </div>
            )}

            {/* Priority Item 2: Discrepancy Watch */}
            {issues.length > 0 && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={15} style={{ color: 'var(--status-warning)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {issues.length} Unresolved Numerical Conflict(s)
                    </strong>
                  </div>
                  <Badge variant="error">{criticalIssues.length} HIGH SEVERITY</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {issues[0].field_name}: Doc A ({issues[0].doc_a_value}) vs Doc B ({issues[0].doc_b_value})
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('validation')}
                    icon={<ExternalLink size={12} />}
                  >
                    Open Discrepancy Matrix
                  </Button>
                </div>
              </div>
            )}

            {/* Priority Item 3: Starred Parliamentary Questions */}
            {unapprovedInquiries.length > 0 && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Landmark size={15} style={{ color: 'var(--accent-teal)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {unapprovedInquiries.length} Starred Inquiry Draft(s)
                    </strong>
                  </div>
                  <Badge variant="teal">{unapprovedInquiries[0].inquiry_ref}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {unapprovedInquiries[0].question_text}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {canApprove && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveInquiry(unapprovedInquiries[0].id)}
                      icon={<CheckCircle2 size={12} />}
                    >
                      Authorize Answer
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('inquiries')}
                    icon={<ExternalLink size={12} />}
                  >
                    Inquiry Workspace
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LEVEL 3: Intelligence & 8-Agent Orchestration DAG */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              8-Agent Autonomous Multi-Agent Pipeline & DAG Execution
            </h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('agents')} icon={<ArrowRight size={13} />}>
            Deep Agent Inspector
          </Button>
        </div>

        <WorkflowTimelineGraph
          agents={agents}
          activeWorkflow={workflows[0]}
          qualityDecision={workflows[0]?.quality_decision || 'PASS'}
          onInspectWorkflow={onInspectWorkflow}
          onSelectAgent={() => onNavigate('agents')}
        />
      </div>

      {/* Quality Gate Status Summary */}
      <QualityGateHero
        decision={workflows[0]?.quality_decision || 'PASS'}
        evaluatedBy="QualityGovernanceAgent (ISO/IEC 25010 Framework)"
        canApprove={canApprove}
      />

      {/* LEVEL 4: Split Operational Queues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 }}>
        {/* Left: Recent Ingested Documents */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Recent Ingested Statutory Documents</h3>
              <p className="card-subtitle">Verified OCR & structured entity chunks</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('documents')} icon={<ArrowRight size={13} />}>
              All Ingestions ({documents.length})
            </Button>
          </div>

          {documents.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No documents processed yet. Upload reports in the Document Center.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onInspectDocument && onInspectDocument(doc.id)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <FileText size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {doc.original_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {doc.subsidiary} • {doc.page_count} pages • {doc.file_type.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <Badge variant="primary">PROCESSED</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Discrepancy Matrix Watch */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Discrepancy Anomaly Stream</h3>
              <p className="card-subtitle">Cross-document numerical variance alerts</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('validation')} icon={<ArrowRight size={13} />}>
              Matrix View ({issues.length})
            </Button>
          </div>

          {issues.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Zero unresolved discrepancies detected across indexed documents.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {issues.slice(0, 3).map((iss) => (
                <div
                  key={iss.id}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid rgba(217, 164, 65, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {iss.field_name || 'Production Conflict'}
                      </span>
                    </div>
                    <Badge variant={iss.severity === 'HIGH' ? 'error' : 'warning'}>
                      {iss.variance_percentage ? `${iss.variance_percentage}% VARIANCE` : 'CONFLICT'}
                    </Badge>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <strong>Doc A:</strong> {iss.doc_a_name} ({iss.doc_a_value}) vs{' '}
                    <strong>Doc B:</strong> {iss.doc_b_name} ({iss.doc_b_value})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
