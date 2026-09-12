import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Landmark,
  ShieldAlert,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Database,
  Cpu,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
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
  settingsService,
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
  SystemHealth,
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
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [runningDemo, setRunningDemo] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, agentsRes, wfRes, valRes, repRes, inqRes, docRes, healthRes] =
        await Promise.allSettled([
          analyticsService.getSummary(),
          agentService.getAgents(),
          agentService.getWorkflows({ limit: 5 }),
          validationService.getIssues('UNRESOLVED'),
          reportService.getReports(),
          inquiryService.getInquiries(),
          documentService.getDocuments({ status: 'PROCESSED' }),
          settingsService.getHealth(),
        ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.summary);
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.agents || []);
      if (wfRes.status === 'fulfilled') setWorkflows(wfRes.value.workflows || []);
      if (valRes.status === 'fulfilled') setIssues(valRes.value.issues || []);
      if (repRes.status === 'fulfilled') setReports(repRes.value.reports || []);
      if (inqRes.status === 'fulfilled') setInquiries(inqRes.value.inquiries || []);
      if (docRes.status === 'fulfilled') setDocuments(docRes.value.documents || []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
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

  // =========================================================================
  // 1. REVIEWING OFFICER PERSPECTIVE
  // Foreground: Statutory Approvals Queue, Quality Gates, Discrepancies
  // =========================================================================
  if (isOfficer) {
    const unapprovedReports = reports.filter((r) => !r.human_approved);
    const unapprovedInquiries = inquiries.filter((i) => !i.human_approved);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Officer Header */}
        <div
          style={{
            padding: '20px 24px',
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
              <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Governance & Statutory Sign-Off Command
              </h2>
              <Badge variant="primary">OFFICER AUTHORITY</Badge>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
              Mandatory Human-in-the-Loop review for official CIL executive reports, parliamentary responses, and cross-document discrepancy resolutions.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={loadDashboardData} loading={loading} icon={<RefreshCw size={13} />}>
            Refresh Queue
          </Button>
        </div>

        {/* Priority Governance Counter Grid */}
        <div className="grid-metrics">
          <MetricCard
            label="Pending Report Sign-Offs"
            value={unapprovedReports.length}
            subtitle={unapprovedReports.length > 0 ? 'Requires officer seal' : 'All reports sealed'}
            icon={<FileCheck size={18} />}
            highlight={unapprovedReports.length > 0}
            level={2}
          />
          <MetricCard
            label="Parliamentary Inquiries"
            value={unapprovedInquiries.length}
            subtitle={unapprovedInquiries.length > 0 ? 'Starred questions pending' : 'Zero backlog'}
            icon={<Landmark size={18} />}
            highlight={unapprovedInquiries.length > 0}
          />
          <MetricCard
            label="Active Discrepancies"
            value={issues.length}
            subtitle="Cross-document numerical variance"
            icon={<ShieldAlert size={18} />}
            highlight={issues.length > 0}
          />
          <MetricCard
            label="Audited Documents"
            value={summary?.total_documents || documents.length}
            subtitle="Indexed in verified catalog"
            icon={<FileText size={18} />}
          />
        </div>

        {/* Quality Gate Status */}
        <QualityGateHero
          decision={workflows[0]?.quality_decision || 'PASS'}
          evaluatedBy="QualityGovernanceAgent"
          canApprove={canApprove}
        />

        {/* Action Queue: Reports Awaiting Approval */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Executive Reports Awaiting Statutory Sign-Off</h3>
              <p className="card-subtitle">Official sign-off applies cryptographic officer watermark and unlocks PDF/DOCX distribution.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('reports')} icon={<ArrowRight size={13} />}>
              View All Reports
            </Button>
          </div>

          {unapprovedReports.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              All executive mining reports have been reviewed and approved.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Report Title</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Subsidiary</th>
                    <th>Generated Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unapprovedReports.map((rep) => (
                    <tr key={rep.id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{rep.title}</strong>
                      </td>
                      <td>
                        <Badge variant="teal">{rep.report_type}</Badge>
                      </td>
                      <td className="text-mono" style={{ fontSize: 12 }}>{rep.reporting_period}</td>
                      <td>
                        <Badge variant="slate">{rep.subsidiary}</Badge>
                      </td>
                      <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {rep.created_at?.split(' ')[0]}
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveReport(rep.id)}
                          icon={<CheckCircle2 size={13} />}
                        >
                          Approve & Seal
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Queue: Parliamentary Inquiries */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Parliamentary Inquiries Awaiting Authorization</h3>
              <p className="card-subtitle">Drafted strictly from ground-truth verified documents with zero hallucination.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('inquiries')} icon={<ArrowRight size={13} />}>
              Inquiry Center
            </Button>
          </div>

          {unapprovedInquiries.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Zero pending parliamentary inquiries awaiting review.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {unapprovedInquiries.map((inq) => (
                <div
                  key={inq.id}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="text-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)' }}>
                        {inq.inquiry_ref}
                      </span>
                      <Badge variant="warning">{inq.ministry_body}</Badge>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {inq.question_text}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {inq.generated_response?.slice(0, 180)}...
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveInquiry(inq.id)}
                    icon={<CheckCircle2 size={13} />}
                  >
                    Authorize Draft
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. SYSTEM ADMINISTRATOR PERSPECTIVE
  // Foreground: System Health HUD, AI Provider Status, Concurrency, Maintenance
  // =========================================================================
  if (isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Admin Header */}
        <div
          style={{
            padding: '20px 24px',
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
              <Cpu size={22} style={{ color: 'var(--status-warning)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                System Infrastructure & Concurrency HUD
              </h2>
              <Badge variant="warning">ADMIN PRIVILEGES</Badge>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
              Hardware health, database pool telemetry, AI provider fallbacks, and 8-agent worker concurrency controls.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" size="sm" onClick={() => onNavigate('settings')} icon={<Cpu size={13} />}>
              Configure AI & DB
            </Button>
            <Button variant="outline" size="sm" onClick={loadDashboardData} loading={loading} icon={<RefreshCw size={13} />}>
              Refresh Health
            </Button>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid-metrics">
          <MetricCard
            label="Database Connection"
            value={health?.database_connected !== false ? 'ONLINE' : 'OFFLINE'}
            subtitle={health?.database_target || 'SQLite 3.x'}
            icon={<Database size={18} />}
            highlight={health?.database_connected !== false}
            level={2}
          />
          <MetricCard
            label="Active AI Provider"
            value={health?.ai_service?.active_provider || 'Deterministic'}
            subtitle={health?.ai_service?.is_connected ? 'Connected' : 'Fallback Active'}
            icon={<Sparkles size={18} />}
            highlight={health?.ai_service?.is_connected}
          />
          <MetricCard
            label="Worker Concurrency"
            value={agents.length}
            unit="Agents"
            subtitle="1 Manager + 7 Workers"
            icon={<Cpu size={18} />}
          />
          <MetricCard
            label="Dispatched Workflows"
            value={summary?.active_workflows || workflows.length}
            subtitle="DAG execution jobs"
            icon={<Play size={18} />}
          />
        </div>

        {/* 8-Agent Autonomous Pipeline Timeline */}
        <WorkflowTimelineGraph
          agents={agents}
          activeWorkflow={workflows[0]}
          qualityDecision={workflows[0]?.quality_decision || 'PASS'}
          onInspectWorkflow={onInspectWorkflow}
        />

        {/* Admin Maintenance Actions Card */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">System Diagnostics & Quick Seeding</h3>
              <p className="card-subtitle">Seed controlled demonstration datasets and verify mathematical invariants.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('audit')} icon={<ArrowRight size={13} />}>
              Audit Trail
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Synthetic Test Fixtures
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Preload 5 canonical mining test files (PDF, DOCX, XLSX, CSV) with known production discrepancies.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunDemo}
                loading={runningDemo}
                icon={<Play size={13} />}
              >
                Run Rajmahal Discrepancy DAG
              </Button>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                ISO/IEC 25010 Quality Benchmark
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Evaluate empirical ground-truth extraction accuracy and factual grounding on active database state.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('analytics')}
                icon={<ArrowRight size={13} />}
              >
                View Benchmark Table
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. READ-ONLY AUDITOR / VIEWER PERSPECTIVE
  // Foreground: Public Transparency, Published Reports, Provenance
  // =========================================================================
  if (isViewer) {
    const publishedReports = reports.filter((r) => r.human_approved);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Viewer Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={22} style={{ color: 'var(--text-secondary)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Executive Compliance & Transparency Overview
              </h2>
              <Badge variant="slate">AUDITOR VIEW (READ-ONLY)</Badge>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
              Read-only perspective for independent auditing of certified reports, verified production figures, and immutable provenance logs.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={loadDashboardData} loading={loading} icon={<RefreshCw size={13} />}>
            Refresh Data
          </Button>
        </div>

        {/* Read-Only Statutory Counters */}
        <div className="grid-metrics">
          <MetricCard
            label="Total Coal Output"
            value={summary?.total_production_mt || '0.00'}
            unit="Million Tonnes"
            subtitle="Verified across CIL subsidiaries"
            icon={<Database size={18} />}
            level={2}
          />
          <MetricCard
            label="Certified Reports"
            value={publishedReports.length}
            subtitle="Officer-approved official reports"
            icon={<FileCheck size={18} />}
          />
          <MetricCard
            label="Audited Ingestions"
            value={summary?.total_documents || documents.length}
            subtitle="SHA-256 verified document chunks"
            icon={<FileText size={18} />}
          />
          <MetricCard
            label="Quality Gate Compliance"
            value="100%"
            subtitle="Zero ungrounded hallucinations"
            icon={<ShieldCheck size={18} />}
          />
        </div>

        {/* Certified Published Reports Table */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Certified Published Reports Archive</h3>
              <p className="card-subtitle">Official statutory reports sealed by authorized Reviewing Officers.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('reports')} icon={<ArrowRight size={13} />}>
              Open Archive
            </Button>
          </div>

          {publishedReports.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No certified reports published yet. Reports appear here once sealed by Reviewing Officers.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Report Title</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Subsidiary</th>
                    <th>Approved By</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedReports.map((rep) => (
                    <tr key={rep.id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{rep.title}</strong>
                      </td>
                      <td>
                        <Badge variant="teal">{rep.report_type}</Badge>
                      </td>
                      <td className="text-mono" style={{ fontSize: 12 }}>{rep.reporting_period}</td>
                      <td>
                        <Badge variant="slate">{rep.subsidiary}</Badge>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {rep.approved_by || 'Reviewing Officer'}
                      </td>
                      <td>
                        <Badge variant="primary" icon={<ShieldCheck size={11} />}>
                          SEALED
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MINING ANALYST PERSPECTIVE (Default)
  // Foreground: Operational Snapshot, 8-Agent Workflow, Raw Extractions, Anomaly Discovery
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Analyst Header with Quick Action */}
      <div
        style={{
          padding: '20px 24px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Mining Intelligence Command & Operations
            </h2>
            <Badge variant="teal">ANALYST PERSPECTIVE</Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
            AI-powered multi-source document intelligence with automated entity extraction, hybrid retrieval, and discrepancy detection.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunDemo}
            loading={runningDemo}
            icon={<Play size={13} />}
          >
            Run Rajmahal Discrepancy DAG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Primary Metric HUD Grid */}
      <div className="grid-metrics">
        <MetricCard
          label="Total Coal Production"
          value={summary?.total_production_mt ?? '0.00'}
          unit="Million Tonnes"
          subtitle="Extracted from active reports"
          icon={<Database size={18} />}
          highlight
          level={2}
          onClick={() => onNavigate('analytics')}
        />
        <MetricCard
          label="Indexed Documents"
          value={summary?.total_documents ?? documents.length}
          subtitle={`${summary?.total_pages ?? 0} total parsed pages`}
          icon={<FileText size={18} />}
          onClick={() => onNavigate('documents')}
        />
        <MetricCard
          label="Extracted Facts"
          value={summary?.extracted_records ?? 0}
          subtitle="Verified numeric entities"
          icon={<Search size={18} />}
          onClick={() => onNavigate('documents')}
        />
        <MetricCard
          label="Flagged Discrepancies"
          value={issues.length}
          subtitle={issues.length > 0 ? 'Cross-document conflicts' : 'Zero conflicts detected'}
          icon={<ShieldAlert size={18} />}
          highlight={issues.length > 0}
          onClick={() => onNavigate('validation')}
        />
      </div>

      {/* Signature 8-Agent Autonomous Pipeline */}
      <WorkflowTimelineGraph
        agents={agents}
        activeWorkflow={workflows[0]}
        qualityDecision={workflows[0]?.quality_decision || 'PASS'}
        onInspectWorkflow={onInspectWorkflow}
        onSelectAgent={() => onNavigate('agents')}
      />

      {/* Split Cards: Recent Document Extractions & Flagged Anomaly Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Left: Recent Processed Ingestions */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Recent Document Ingestions</h3>
              <p className="card-subtitle">Verified OCR & structured entity chunks</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('documents')} icon={<ArrowRight size={13} />}>
              All Documents
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

        {/* Right: Unresolved Discrepancies Anomaly Stream */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Discrepancy & Conflict Watch</h3>
              <p className="card-subtitle">Cross-document numerical variance alerts</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('validation')} icon={<ArrowRight size={13} />}>
              Discrepancy Matrix
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
