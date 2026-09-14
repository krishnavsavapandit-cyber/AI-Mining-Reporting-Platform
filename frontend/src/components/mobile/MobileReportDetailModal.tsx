import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, Download, X, ShieldCheck } from 'lucide-react';
import { reportService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ReportRecord } from '@/types';

export interface MobileReportDetailModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onReportApproved?: () => void;
}

export const MobileReportDetailModal: React.FC<MobileReportDetailModalProps> = ({
  reportId,
  isOpen,
  onClose,
  onReportApproved,
}) => {
  const [report, setReport] = useState<ReportRecord | null>(null);
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
      setPdfUrl(null);
      setDocxUrl(null);
    }
  }, [isOpen, reportId]);

  const loadReport = async (id: number) => {
    setLoading(true);
    try {
      const res = await reportService.getReport(id);
      setReport(res.report);
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

  if (!isOpen) return null;

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mobile-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileCheck size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {report ? report.title : 'Report Viewer'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {report?.subsidiary} • {report?.reporting_period}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="mobile-modal-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading report synthesis and evidence citations...
            </div>
          ) : report ? (
            <>
              {/* Status Banner */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: report.human_approved
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                  border: report.human_approved
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {report.human_approved ? (
                    <ShieldCheck size={16} style={{ color: '#10B981' }} />
                  ) : (
                    <span style={{ fontSize: 14 }}>⚠️</span>
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: report.human_approved ? '#10B981' : '#F59E0B',
                    }}
                  >
                    {report.human_approved ? 'SEALED & VERIFIED' : 'STATUTORY DRAFT'}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {report.approved_by ? `By: ${report.approved_by}` : 'Pending Sign-Off'}
                </span>
              </div>

              {/* Report Narrative Content */}
              <div
                style={{
                  padding: 14,
                  backgroundColor: 'var(--bg-surface-2)',
                  borderRadius: 8,
                  border: '1px solid var(--border-hairline)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                {((report as unknown as Record<string, unknown>).content_markdown as string) || report.summary || 'Summary unavailable.'}
              </div>

              {/* Approval Action for Officers */}
              {!report.human_approved && isOfficerOrAbove && (
                <button
                  type="button"
                  className="mobile-btn-touch mobile-btn-primary"
                  onClick={handleApprove}
                  disabled={isApproving}
                >
                  <CheckCircle2 size={16} />
                  {isApproving ? 'Applying Seal...' : 'Approve & Affix Statutory Seal'}
                </button>
              )}

              {/* Download links */}
              <div style={{ display: 'flex', gap: 8 }}>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mobile-btn-touch mobile-btn-secondary"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Download size={14} /> PDF
                  </a>
                )}
                {docxUrl && (
                  <a
                    href={docxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mobile-btn-touch mobile-btn-secondary"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Download size={14} /> DOCX
                  </a>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
