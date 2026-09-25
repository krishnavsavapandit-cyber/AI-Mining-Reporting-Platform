import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  RotateCcw,
  Trash2,
  History,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { reportService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ReportRecord, ReportVersionItem } from '@/types';

interface ReportsPageProps {
  onInspectReport?: (id: number) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onInspectReport }) => {
  const { role, canApprove, isViewer } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [timeFilter, setTimeFilter] = useState<
    'ALL' | '15M' | '1H' | '6H' | '24H' | '1W' | '1M' | '3M' | '6M' | '1Y'
  >('ALL');
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  
  // Selected Version Lineage Modal / Popover State
  const [selectedVersionLineage, setSelectedVersionLineage] = useState<{
    reportCode: string;
    versions: ReportVersionItem[];
  } | null>(null);

  // Form State
  const [reportType, setReportType] = useState('Monthly Production Summary');
  const [title, setTitle] = useState('');
  const [subsidiary, setSubsidiary] = useState('ECL');
  const [reportingPeriod, setReportingPeriod] = useState('May 2025');
  const [instructions, setInstructions] = useState('');

  const toast = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportService.getReports();
      setReports(res.reports || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading reports';
      toast.error('Reports Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    toast.info('Synthesizing Executive Report', 'Extracting domain facts and compiling 16-section executive report...');
    try {
      const res = await reportService.generateReport({
        report_type: reportType,
        title: title || `${subsidiary} ${reportType} (${reportingPeriod})`,
        subsidiary,
        reporting_period: reportingPeriod,
        instructions,
      });
      toast.success('Report Compiled', 'Executive report drafted and sent to quality gate.');
      setShowGenerateForm(false);
      loadReports();
      if (res.report?.id && onInspectReport) {
        onInspectReport(res.report.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast.error('Report Generation Error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reportService.approveReport(reportId, { approved_by: `Reviewing Officer (${role})` });
      toast.success('Report Approved', 'Statutory watermark and sign-off recorded.');
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Approval Error', msg);
    }
  };

  const handleRevoke = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Revoke approval for report #${reportId} and revert to Draft?`)) return;
    try {
      await reportService.revokeApproval(reportId);
      toast.success('Approval Revoked', `Report #${reportId} reverted back to Draft.`);
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Revoke failed';
      toast.error('Revocation Error', msg);
    }
  };

  const handleDelete = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete report #${reportId}?`)) return;
    try {
      await reportService.deleteReport(reportId);
      toast.success('Report Deleted', `Report #${reportId} permanently removed.`);
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Delete Error', msg);
    }
  };

  const handleOpenVersions = async (report: ReportRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const reportCode = report.report_id_str || `RPT-${report.id}`;
    try {
      const res = await reportService.getReportVersions(reportCode);
      setSelectedVersionLineage({
        reportCode,
        versions: res.versions || [],
      });
    } catch (err: unknown) {
      toast.error('Version Fetch Error', 'Unable to retrieve version history for report.');
    }
  };

  const isWithinTimeRange = (createdAt: string, range: string): boolean => {
    if (range === 'ALL' || !createdAt) return true;
    const now = Date.now();
    const createdTime = new Date(createdAt.replace(' ', 'T')).getTime();
    if (isNaN(createdTime)) return true;
    const diffMs = now - createdTime;

    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    switch (range) {
      case '15M':
        return diffMs <= 15 * MINUTE;
      case '1H':
        return diffMs <= 1 * HOUR;
      case '6H':
        return diffMs <= 6 * HOUR;
      case '24H':
        return diffMs <= 24 * HOUR;
      case '1W':
        return diffMs <= 7 * DAY;
      case '1M':
        return diffMs <= 30 * DAY;
      case '3M':
        return diffMs <= 90 * DAY;
      case '6M':
        return diffMs <= 180 * DAY;
      case '1Y':
        return diffMs <= 365 * DAY;
      default:
        return true;
    }
  };

  const filteredReports = reports.filter((rep) => {
    if (statusFilter === 'APPROVED' && !rep.human_approved) return false;
    if (statusFilter === 'PENDING' && rep.human_approved) return false;
    if (subsidiaryFilter && rep.subsidiary !== subsidiaryFilter) return false;
    if (!isWithinTimeRange(rep.created_at, timeFilter)) return false;
    return true;
  });

  const sealedCount = reports.filter((r) => r.human_approved).length;
  const pendingCount = reports.filter((r) => !r.human_approved).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(31, 138, 92, 0.12)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <FileCheck size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Executive Report Center & Versioning Archive
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Deterministic 16-section executive synthesis, version lineage (v1, v2, v3), cross-document validation, and multi-format PDF & DOCX generation.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isViewer && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowGenerateForm(!showGenerateForm)}
              icon={<Plus size={16} />}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 0 14px rgba(31, 138, 92, 0.4)',
              }}
            >
              {showGenerateForm ? 'Cancel Form' : '+ Generate New Executive Report'}
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={loadReports}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. Report Lifecycle Progress Banner (Summary) */}
      <div
        style={{
          padding: '18px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              EXECUTIVE REPORT LIFECYCLE & VERSION GOVERNANCE
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span><strong>{sealedCount}</strong> Sealed</span>
            <span>•</span>
            <span><strong>{pendingCount}</strong> Pending Sign-Off</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {[
            { step: '01', title: 'Data Ingestion & Run', desc: '8-Agent Unified Processing Run' },
            { step: '02', title: 'Fact Normalization', desc: 'Strict Value / Unit Separation' },
            { step: '03', title: 'Validation Audit', desc: 'Cross-Doc Invariant Conflict Check' },
            { step: '04', title: 'Versioned Synthesis', desc: 'Immutable v1/v2/v3 Increment' },
            { step: '05', title: 'Publication & Seal', desc: 'Clean PDF / DOCX Distribution' },
          ].map((st, idx) => (
            <div
              key={st.step}
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  STAGE {st.step}
                </span>
                {idx < 4 && <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{st.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{st.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Report Form Modal / Drawer */}
      {showGenerateForm && (
        <div className="card-level-2">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            Configure & Compile Executive Mining Report
          </h3>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  REPORT TYPE
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="input-select"
                >
                  <option value="Monthly Production Summary">Monthly Production Summary</option>
                  <option value="Discrepancy Investigation">Discrepancy Investigation</option>
                  <option value="HEMM & OBR Operational Audit">HEMM & OBR Operational Audit</option>
                  <option value="Geological Exploration Assessment">Geological Exploration Assessment</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  CIL SUBSIDIARY
                </label>
                <select
                  value={subsidiary}
                  onChange={(e) => setSubsidiary(e.target.value)}
                  className="input-select"
                >
                  <option value="ECL">Eastern Coalfields Limited (ECL)</option>
                  <option value="BCCL">Bharat Coking Coal Limited (BCCL)</option>
                  <option value="CCL">Central Coalfields Limited (CCL)</option>
                  <option value="WCL">Western Coalfields Limited (WCL)</option>
                  <option value="SECL">South Eastern Coalfields Limited (SECL)</option>
                  <option value="MCL">Mahanadi Coalfields Limited (MCL)</option>
                  <option value="NCL">Northern Coalfields Limited (NCL)</option>
                  <option value="CMPDI">CMPDI Corporate</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  REPORTING PERIOD
                </label>
                <input
                  type="text"
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  placeholder="e.g. May 2025, Q1 2025"
                  className="input-text"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                REPORT TITLE (OPTIONAL)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leave blank for auto-generated title"
                className="input-text"
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                EXECUTIVE INSTRUCTIONS / FOCUS AREAS
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Highlight Rajmahal OCP discrepancy, OBR variance, and HEMM availability..."
                className="input-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowGenerateForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={generating} icon={<FileCheck size={13} />}>
                Compile Executive Report
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Workspace Filter Toolbar (Analysis) */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('ALL')}
          >
            All Reports ({reports.length})
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending Sign-Off ({pendingCount})
          </Button>
          <Button
            variant={statusFilter === 'APPROVED' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('APPROVED')}
          >
            Sealed & Published ({sealedCount})
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TIME:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="input-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 12, backgroundColor: 'var(--bg-surface-2)' }}
            >
              <option value="ALL">All Time</option>
              <option value="15M">Last 15 Mins</option>
              <option value="1H">Last 1 Hour</option>
              <option value="6H">Last 6 Hours</option>
              <option value="24H">Last 24 Hours</option>
              <option value="1W">Last 1 Week</option>
              <option value="1M">Last 1 Month</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last 1 Year</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>SUBSIDIARY:</span>
            <select
              value={subsidiaryFilter}
              onChange={(e) => setSubsidiaryFilter(e.target.value)}
              className="input-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
            >
              <option value="">All Subsidiaries</option>
              <option value="ECL">ECL</option>
              <option value="BCCL">BCCL</option>
              <option value="CCL">CCL</option>
              <option value="WCL">WCL</option>
              <option value="SECL">SECL</option>
              <option value="MCL">MCL</option>
              <option value="NCL">NCL</option>
              <option value="CMPDI">CMPDI</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Reports Catalog Queue (Detail & Action) */}
      {filteredReports.length === 0 && !loading ? (
        <EmptyState
          type="reports"
          title="No Reports in Archive"
          description="Synthesize new executive reports from ground-truth document facts."
        />
      ) : (
        <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 65 }}>Report ID</th>
                  <th>Report Title & Run</th>
                  <th>Latest Version</th>
                  <th>Type</th>
                  <th>Subsidiary</th>
                  <th>Discrepancies</th>
                  <th>Approval State</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((rep) => {
                  const reportCode = rep.report_id_str || `RPT-${rep.id}`;
                  const versionNum = rep.version_number || 1;
                  const discCount = rep.discrepancy_count || 0;

                  return (
                    <tr
                      key={rep.id}
                      onClick={() => onInspectReport && onInspectReport(rep.id)}
                      style={{ cursor: onInspectReport ? 'pointer' : 'default' }}
                    >
                      <td className="text-mono" style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {reportCode}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileCheck size={15} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                            <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                              {rep.title}
                            </strong>
                          </div>
                          {rep.run_id && (
                            <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Run: {rep.run_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge variant="teal" icon={<History size={11} />}>
                          v{versionNum}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="slate">{rep.report_type}</Badge>
                      </td>
                      <td>
                        <Badge variant="slate">{rep.subsidiary}</Badge>
                      </td>
                      <td>
                        {discCount === 0 ? (
                          <Badge variant="primary">0 Conflicts</Badge>
                        ) : (
                          <Badge variant="warning">
                            {discCount} Conflicts
                          </Badge>
                        )}
                      </td>
                      <td>
                        {rep.human_approved ? (
                          <Badge variant="primary" icon={<CheckCircle2 size={11} />}>
                            SEALED ({rep.approved_by?.split(' ')[0] || 'Officer'})
                          </Badge>
                        ) : (
                          <Badge variant="warning" icon={<Clock size={11} />}>
                            DRAFT
                          </Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectReport && onInspectReport(rep.id);
                            }}
                            icon={<Eye size={12} />}
                            style={{ padding: '3px 8px' }}
                          >
                            View
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => handleOpenVersions(rep, e)}
                            icon={<History size={12} />}
                            style={{ padding: '3px 8px' }}
                            title="View all versions"
                          >
                            Versions
                          </Button>

                          {rep.file_path && (
                            <a
                              href={reportService.getDownloadUrl(rep.file_path.split('/').pop() || rep.file_path)}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px' }}
                              title="Download PDF"
                            >
                              <Download size={12} style={{ color: 'var(--accent-primary)' }} />
                            </a>
                          )}

                          {!rep.human_approved && canApprove && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => handleApprove(rep.id, e)}
                              icon={<CheckCircle2 size={12} />}
                              style={{ padding: '3px 8px' }}
                            >
                              Approve
                            </Button>
                          )}

                          {rep.human_approved && canApprove && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleRevoke(rep.id, e)}
                              icon={<RotateCcw size={12} style={{ color: 'var(--status-warning)' }} />}
                              style={{ padding: '3px 8px', color: 'var(--status-warning)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                              title="Revert accidental approval back to Draft"
                            >
                              Revoke
                            </Button>
                          )}

                          {canApprove && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDelete(rep.id, e)}
                              icon={<Trash2 size={12} style={{ color: 'var(--status-error)' }} />}
                              style={{ padding: '3px 8px', color: 'var(--status-error)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                              title="Permanently delete report"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {selectedVersionLineage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedVersionLineage(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              boxShadow: 'var(--shadow-level-2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} style={{ color: 'var(--accent-teal)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Version Lineage for {selectedVersionLineage.reportCode}
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedVersionLineage(null)}>
                Close
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
              {selectedVersionLineage.versions.map((v) => (
                <div
                  key={v.id}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-teal)' }}>
                        v{v.version_number}
                      </span>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {v.title || selectedVersionLineage.reportCode}
                      </strong>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Generated: {v.created_at} | Run: <span className="text-mono">{v.run_id || 'System'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant={v.discrepancy_count === 0 ? 'primary' : 'warning'}>
                      {v.discrepancy_count === 0 ? 'Clean' : `${v.discrepancy_count} Conflicts`}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVersionLineage(null);
                        onInspectReport && onInspectReport(v.id);
                      }}
                    >
                      View
                    </Button>
                    {v.pdf_url && (
                      <a href={v.pdf_url} download className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }}>
                        PDF
                      </a>
                    )}
                    {v.docx_url && (
                      <a href={v.docx_url} download className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }}>
                        DOCX
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
