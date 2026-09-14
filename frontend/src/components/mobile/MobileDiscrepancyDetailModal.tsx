import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { validationService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DiscrepancyIssue } from '@/types';

export interface MobileDiscrepancyDetailModalProps {
  issue: DiscrepancyIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueResolved?: () => void;
}

export const MobileDiscrepancyDetailModal: React.FC<MobileDiscrepancyDetailModalProps> = ({
  issue,
  isOpen,
  onClose,
  onIssueResolved,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { isOfficerOrAbove, roleInfo } = useAuth();
  const toast = useToast();

  if (!isOpen || !issue) return null;

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await validationService.resolveIssue(issue.id, {
        resolved_by: roleInfo.name,
        note: resolutionNotes || `Resolved by ${roleInfo.name}`,
      });
      toast.success(
        'Discrepancy Resolved',
        'Updated cross-document conflict registry.'
      );
      if (onIssueResolved) onIssueResolved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resolution failed';
      toast.error('Resolution Error', msg);
    } finally {
      setIsResolving(false);
    }
  };

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
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--status-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={18} />
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
                {issue.field_name || 'Production Discrepancy'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--status-error)' }}>
                {issue.severity} Severity • {issue.variance_percentage ? `${issue.variance_percentage}% Variance` : 'Conflict'}
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
          {/* Conflicting Values Comparison */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {/* Doc A */}
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-surface-2)',
                borderRadius: 8,
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)' }}>DOCUMENT A</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                {issue.doc_a_name || 'Report A'}
              </span>
              <span className="text-mono" style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B' }}>
                {issue.doc_a_value ?? 'N/A'}
              </span>
            </div>

            {/* Doc B */}
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-surface-2)',
                borderRadius: 8,
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: '#F472B6' }}>DOCUMENT B</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                {issue.doc_b_name || 'Report B'}
              </span>
              <span className="text-mono" style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>
                {issue.doc_b_value ?? 'N/A'}
              </span>
            </div>
          </div>

          {/* Conflict Analysis Description */}
          <div
            style={{
              padding: 12,
              backgroundColor: 'var(--bg-surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border-hairline)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {issue.reviewer_note || issue.resolved_note || ((issue as unknown as Record<string, unknown>).description as string) || 'Variance detected across multi-source operational reporting periods.'}
          </div>

          {/* Resolution Input for Officers */}
          {issue.status === 'UNRESOLVED' && isOfficerOrAbove && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                OFFICER RESOLUTION NOTES
              </label>
              <textarea
                className="mobile-input"
                placeholder="Enter justification or correction source..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                style={{ height: 60, padding: 8, resize: 'none', fontSize: 12 }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="mobile-btn-touch mobile-btn-primary"
                  onClick={handleResolve}
                  disabled={isResolving}
                  style={{ flex: 1 }}
                >
                  <CheckCircle2 size={14} /> Resolve Conflict
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
