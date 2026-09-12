import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { reportService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ReportRecord } from '@/types';

interface ReportsPageProps {
  onInspectReport?: (id: number) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onInspectReport }) => {
  const { role, canApprove, isViewer } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);

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
    toast.info('Synthesizing Report', 'Extracting facts and compiling executive narrative...');
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

  const handleApprove = async (reportId: number) => {
    try {
      await reportService.approveReport(reportId, { approved_by: `Reviewing Officer (${role})` });
      toast.success('Report Approved', 'Statutory watermark and sign-off recorded.');
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Approval Error', msg);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(31, 138, 92, 0.1)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <FileCheck size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Automated Executive Mining Reports
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Synthesize multi-source geological and production records into formal PDF & DOCX reports with statutory sign-off.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isViewer && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowGenerateForm(!showGenerateForm)}
              icon={<Plus size={13} />}
            >
              {showGenerateForm ? 'Cancel Form' : 'Generate New Report'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
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
                placeholder="e.g. Focus on Rajmahal OCP discrepancy and HEMM availability degradation..."
                className="input-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowGenerateForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={generating} icon={<FileCheck size={13} />}>
                Compile Report
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Table */}
      {reports.length === 0 && !loading ? (
        <EmptyState
          type="reports"
          title="No Compiled Reports Yet"
          description="Synthesize executive reports from indexed document chunks and extraction tables."
          action={
            !isViewer ? (
              <Button variant="primary" size="sm" onClick={() => setShowGenerateForm(true)} icon={<Plus size={13} />}>
                Generate First Report
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Report Title</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Subsidiary</th>
                  <th>Sign-Off State</th>
                  <th>Compiled Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr
                    key={rep.id}
                    onClick={() => onInspectReport && onInspectReport(rep.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      #{rep.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileCheck size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <strong style={{ color: 'var(--text-primary)' }}>{rep.title}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge variant="teal">{rep.report_type}</Badge>
                    </td>
                    <td className="text-mono" style={{ fontSize: 12 }}>{rep.reporting_period}</td>
                    <td>
                      <Badge variant="slate">{rep.subsidiary}</Badge>
                    </td>
                    <td>
                      <Badge
                        variant={rep.human_approved ? 'primary' : 'warning'}
                        icon={rep.human_approved ? <ShieldCheck size={11} /> : undefined}
                      >
                        {rep.human_approved ? 'SEALED & APPROVED' : 'PENDING SIGN-OFF'}
                      </Badge>
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {rep.created_at?.split(' ')[0]}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {rep.file_path && (
                          <a
                            href={`/api/reports/download/${encodeURIComponent(rep.file_path.split('/').pop() || rep.file_path)}`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-secondary btn-sm"
                            title="Download Report File"
                            style={{ padding: '3px 8px', textDecoration: 'none' }}
                          >
                            <Download size={12} style={{ color: 'var(--accent-primary)' }} />
                          </a>
                        )}

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

                        {canApprove && !rep.human_approved && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(rep.id);
                            }}
                            icon={<CheckCircle2 size={12} />}
                            style={{ padding: '3px 8px' }}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
