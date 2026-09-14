import React, { useState } from 'react';
import { Landmark, CheckCircle2, X, FileText, Sparkles } from 'lucide-react';
import { inquiryService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { InquiryRecord } from '@/types';

export interface MobileInquiryDetailModalProps {
  inquiry: InquiryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onInquiryApproved?: () => void;
}

interface CitationItem {
  document_name?: string;
  page_number?: number;
  excerpt?: string;
}

export const MobileInquiryDetailModal: React.FC<MobileInquiryDetailModalProps> = ({
  inquiry,
  isOpen,
  onClose,
  onInquiryApproved,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const { isOfficerOrAbove, roleInfo } = useAuth();
  const toast = useToast();

  if (!isOpen || !inquiry) return null;

  let citationsList: CitationItem[] = [];
  if (inquiry.citations_json) {
    try {
      citationsList = JSON.parse(inquiry.citations_json);
    } catch {
      citationsList = [];
    }
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await inquiryService.approveInquiry(inquiry.id, {
        approved_by: `${roleInfo.name} (${roleInfo.role})`,
      });
      toast.success('Inquiry Authorized', 'Parliamentary answer released for submission.');
      if (onInquiryApproved) onInquiryApproved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authorization failed';
      toast.error('Authorization Error', msg);
    } finally {
      setIsApproving(false);
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
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--status-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Landmark size={18} />
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
                {inquiry.inquiry_ref || 'Parliamentary Inquiry'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {inquiry.ministry_body || 'Ministry of Coal'}
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
          {/* Question Text */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-teal)', marginBottom: 4 }}>
              QUESTION TEXT ({inquiry.parsed_intent || 'Intent Analysis'})
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {inquiry.question_text}
            </div>
          </div>

          {/* Generated Grounded Answer */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} /> GROUNDED EVIDENCE-BASED ANSWER
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {inquiry.generated_response || 'No response generated yet.'}
            </div>
          </div>

          {/* Citations List if available */}
          {citationsList.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                OFFICIAL CITATIONS & EVIDENCE SOURCES ({citationsList.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {citationsList.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 6,
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FileText size={12} style={{ color: 'var(--accent-teal)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.document_name || 'Document'}</span>
                    {c.page_number && <span>(Page {c.page_number})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Officer Approval Button */}
          {!inquiry.human_approved && isOfficerOrAbove && (
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-primary"
              onClick={handleApprove}
              disabled={isApproving}
            >
              <CheckCircle2 size={16} />
              {isApproving ? 'Authorizing...' : 'Authorize Parliamentary Draft'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
