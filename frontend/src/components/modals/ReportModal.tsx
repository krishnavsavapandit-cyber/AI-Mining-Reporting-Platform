import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { reportService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ReportRecord } from '@/types';

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
  const [loading, setLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { isOfficerOrAbove, roleInfo } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && reportId) {
      loadReport(reportId);
    } else {
      setReport(null);
    }
  }, [isOpen, reportId]);

  const loadReport = async (id: number) => {
    setLoading(true);
    try {
      const res = await reportService.getReport(id);
      setReport(res.report);
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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileCheck size={16} style={{ color: 'var(--accent-primary)' }} />
          <span className="truncate" style={{ maxWidth: 460 }}>
            {report ? report.title : 'Statutory Report Viewer'}
          </span>
          {report && (
            <Badge variant={report.human_approved ? 'primary' : 'warning'}>
              {report.human_approved ? 'OFFICIALLY APPROVED' : 'DRAFT (PENDING SIGN-OFF)'}
            </Badge>
          )}
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            {report && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {report.approved_by ? `Approved By: ${report.approved_by}` : 'Pending designated reviewing officer sign-off'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {report && !report.human_approved && isOfficerOrAbove && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                loading={isApproving}
                icon={<CheckCircle2 size={12} />}
              >
                Approve & Sign-Off Report
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Viewer
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading compiled report text...
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
              <span style={{ color: 'var(--text-muted)' }}>Type:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{report.report_type}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Scope:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{report.subsidiary || 'All CIL'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Period:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--text-primary)' }}>{report.reporting_period || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Compiled:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--text-muted)' }}>{report.created_at}</strong>
            </div>
          </div>

          {/* Report Body Content (Markdown Styled) */}
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
        </div>
      ) : null}
    </Modal>
  );
};
