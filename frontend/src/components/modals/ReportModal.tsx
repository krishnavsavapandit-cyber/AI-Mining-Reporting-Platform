import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Download,
  FileText,
  RotateCcw,
  Trash2,
  History,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { reportService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ReportRecord, ReportVersionItem } from '@/types';

export interface ReportModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onReportApproved?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  reportId,
  isOpen,
  onClose,
  onReportApproved,
}) => {
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [versionHistory, setVersionHistory] = useState<ReportVersionItem[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { isOfficerOrAbove, roleInfo } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && reportId) {
      loadReport(reportId);
    } else {
      setReport(null);
      setVersionHistory([]);
      setShowVersionHistory(false);
      setPdfUrl(null);
      setDocxUrl(null);
    }
  }, [isOpen, reportId]);

  const loadReport = async (id: number) => {
    setLoading(true);
    try {
      const res = await reportService.getReport(id);
      setReport(res.report);
      setVersionHistory(res.version_history || []);
      setPdfUrl(res.pdf_url || null);
      setDocxUrl(res.docx_url || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch report';
      toast.error('Report Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!reportId) return;
    setIsApproving(true);
    try {
      await reportService.approveReport(reportId, {
        approved_by: `${roleInfo.name} (${roleInfo.role})`,
      });
      toast.success('Report Approved', 'Official sign-off recorded for report release.');
      loadReport(reportId);
      if (onReportApproved) onReportApproved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Approval Error', msg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRevokeApproval = async () => {
    if (!reportId) return;
    if (!window.confirm('Are you sure you want to revoke this approval and revert the report back to Draft?')) return;
    setIsApproving(true);
    try {
      await reportService.revokeApproval(reportId);
      toast.success('Approval Revoked', 'Report has been reverted back to Draft status.');
      loadReport(reportId);
      if (onReportApproved) onReportApproved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Revoke failed';
      toast.error('Revocation Error', msg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportId) return;
    if (!window.confirm('Are you sure you want to permanently delete this report? This cannot be undone.')) return;
    try {
      await reportService.deleteReport(reportId);
      toast.success('Report Deleted', 'Report removed from records.');
      onClose();
      if (onReportApproved) onReportApproved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Delete Error', msg);
    }
  };

  if (!isOpen) return null;

  const currentVersion = report?.version_number || 1;
  const reportCode = report?.report_id_str || `RPT-${report?.id || 1}`;
  const runId = report?.run_id || 'RUN-2026-N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <FileCheck size={18} style={{ color: 'var(--accent-primary)' }} />
          <span className="truncate" style={{ maxWidth: 400, fontWeight: 700 }}>
            {report ? report.title : 'Executive Report Viewer'}
          </span>
          {report && (
            <Badge variant="teal">
              {reportCode} v{currentVersion}
            </Badge>
          )}
          {report && (
            <Badge variant={report.human_approved ? 'primary' : 'warning'}>
              {report.human_approved ? 'OFFICIALLY APPROVED' : 'DRAFT (PENDING SIGN-OFF)'}
            </Badge>
          )}
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            {report && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {report.approved_by ? `Approved By: ${report.approved_by}` : 'Pending designated reviewing officer sign-off'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Version History Toggle */}
            {versionHistory.length > 1 && (
              <Button
                variant={showVersionHistory ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                icon={<History size={13} />}
              >
                {showVersionHistory ? 'Hide History' : `Version History (${versionHistory.length})`}
              </Button>
            )}

            {/* Real PDF / DOCX Downloads */}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <Download size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>Download PDF (v{currentVersion})</span>
              </a>
            )}

            {docxUrl && (
              <a
                href={docxUrl}
                download
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <FileText size={12} style={{ color: 'var(--accent-teal)' }} />
                <span>Download DOCX (v{currentVersion})</span>
              </a>
            )}

            {report && !report.human_approved && isOfficerOrAbove && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                loading={isApproving}
                icon={<CheckCircle2 size={12} />}
              >
                Approve & Sign-Off
              </Button>
            )}

            {report && report.human_approved && isOfficerOrAbove && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeApproval}
                loading={isApproving}
                icon={<RotateCcw size={12} style={{ color: 'var(--status-warning)' }} />}
                style={{ borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}
                title="Revert accidental approval back to Draft"
              >
                Revoke Approval
              </Button>
            )}

            {report && isOfficerOrAbove && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteReport}
                icon={<Trash2 size={12} style={{ color: 'var(--status-error)' }} />}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--status-error)' }}
                title="Permanently delete this report"
              >
                Delete
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading compiled executive report...
        </div>
      ) : report ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Metadata Banner */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Report ID:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--accent-primary)' }}>{reportCode}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Latest Version:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--accent-teal)' }}>v{currentVersion}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Processing Run:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--text-primary)' }}>{runId}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Scope:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{report.subsidiary || 'All CIL'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Period:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--text-primary)' }}>{report.reporting_period || 'N/A'}</strong>
            </div>
          </div>

          {/* Version History Drawer (if expanded) */}
          {showVersionHistory && versionHistory.length > 0 && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'rgba(15, 41, 66, 0.4)',
                border: '1px solid var(--accent-teal)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={15} style={{ color: 'var(--accent-teal)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  VERSION LINEAGE & AUDIT LOG ({reportCode})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {versionHistory.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: v.version_number === currentVersion ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                      border: `1px solid ${v.version_number === currentVersion ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-teal)' }}>
                        v{v.version_number}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Generated: {v.created_at}
                      </span>
                      <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        [{v.run_id || 'System Run'}]
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge variant={v.discrepancy_count === 0 ? 'primary' : 'warning'}>
                        {v.discrepancy_count === 0 ? 'Verified Clean' : `${v.discrepancy_count} Conflicts`}
                      </Badge>
                      {v.pdf_url && (
                        <a href={v.pdf_url} download className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>
                          PDF
                        </a>
                      )}
                      {v.docx_url && (
                        <a href={v.docx_url} download className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>
                          DOCX
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Body Content (Rendered HTML or Fallback Text) */}
          {report.html_content ? (
            <div
              style={{
                maxHeight: 520,
                overflowY: 'auto',
                borderRadius: 'var(--radius-sm)',
              }}
              dangerouslySetInnerHTML={{ __html: report.html_content }}
            />
          ) : (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px 24px',
                lineHeight: 1.7,
                fontSize: 13,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                maxHeight: 480,
                overflowY: 'auto',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {report.summary || 'No report content available.'}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
