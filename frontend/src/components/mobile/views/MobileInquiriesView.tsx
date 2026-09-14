import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { inquiryService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { InquiryRecord } from '@/types';

interface MobileInquiriesViewProps {
  onInspectInquiry: (inquiry: InquiryRecord) => void;
}

export const MobileInquiriesView: React.FC<MobileInquiriesViewProps> = ({ onInspectInquiry }) => {
  const { isOfficerOrAbove, roleInfo } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [inquiryRef, setInquiryRef] = useState('');
  const [ministryBody, setMinistryBody] = useState('Ministry of Coal');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const res = await inquiryService.getInquiries();
      setInquiries(res.inquiries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch inquiries';
      toast.error('Inquiries Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitting(true);
    toast.info('Formulating Answer', 'Retrieving evidence-grounded facts for parliamentary response...');
    try {
      await inquiryService.generateInquiry({
        inquiry_ref: inquiryRef || `INQ-LS-${Math.floor(1000 + Math.random() * 9000)}`,
        question_text: questionText,
        ministry_body: ministryBody,
      });
      toast.success('Inquiry Drafted', 'Parliamentary question formulated with grounded citations.');
      setShowForm(false);
      setQuestionText('');
      setInquiryRef('');
      loadInquiries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Formulation error';
      toast.error('Draft Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await inquiryService.approveInquiry(id, {
        approved_by: `${roleInfo.name} (${roleInfo.role})`,
      });
      toast.success('Authorized', 'Parliamentary response authorized.');
      loadInquiries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authorization failed';
      toast.error('Auth Error', msg);
    }
  };

  const filtered = inquiries.filter(
    (i) =>
      i.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.inquiry_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.ministry_body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mobile-main-viewport">
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="mobile-input"
            placeholder="Search parliamentary questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        <button
          type="button"
          onClick={loadInquiries}
          disabled={loading}
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Draft New Inquiry Button */}
      <button
        type="button"
        className="mobile-btn-touch mobile-btn-primary"
        onClick={() => setShowForm((prev) => !prev)}
      >
        <Plus size={16} /> {showForm ? 'Cancel Formulation' : 'Formulate Parliamentary Question'}
      </button>

      {/* Formulation Form Drawer */}
      {showForm && (
        <form
          onSubmit={handleCreateInquiry}
          className="mobile-card"
          style={{ border: '1px solid var(--accent-primary)' }}
        >
          <h4 className="mobile-card-title">Parliamentary Question Formulation</h4>
          <input
            type="text"
            className="mobile-input"
            placeholder="Inquiry Reference (e.g., Starred Question No. 142)"
            value={inquiryRef}
            onChange={(e) => setInquiryRef(e.target.value)}
          />

          <textarea
            className="mobile-input"
            placeholder="Official Question Text (e.g., What are the total coal reserves and stripping ratios for Rajmahal OCP?)"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            style={{ height: 80, padding: 10, resize: 'none' }}
            required
          />

          <select
            className="mobile-input"
            value={ministryBody}
            onChange={(e) => setMinistryBody(e.target.value)}
          >
            <option value="Ministry of Coal">Ministry of Coal</option>
            <option value="DGMS">DGMS</option>
            <option value="MoEFCC">MoEFCC</option>
          </select>

          <button
            type="submit"
            className="mobile-btn-touch mobile-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Retrieving & Formulating...' : 'Generate Grounded Answer'}
          </button>
        </form>
      )}

      {/* Inquiries List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading parliamentary inquiries...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mobile-card" style={{ textAlign: 'center', padding: 32 }}>
          <Landmark size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            No Inquiries Found
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Formulate a new inquiry question above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((inq) => (
            <div
              key={inq.id}
              className="mobile-card"
              onClick={() => onInspectInquiry(inq)}
              style={{ cursor: 'pointer', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <span className="text-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)' }}>
                    {inq.inquiry_ref}
                  </span>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {inq.ministry_body}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: inq.human_approved
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    color: inq.human_approved ? '#10B981' : '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  {inq.human_approved ? 'AUTHORIZED' : 'DRAFT'}
                </span>
              </div>

              {/* Question text snippet */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {inq.question_text}
              </div>

              {/* Answer snippet */}
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {inq.generated_response?.slice(0, 120)}...
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {inq.created_at?.split('T')[0] || inq.created_at}
                </span>

                {!inq.human_approved && isOfficerOrAbove ? (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-primary"
                    onClick={(e) => handleApprove(inq.id, e)}
                    style={{ height: 28, padding: '0 8px', fontSize: 10, width: 'auto' }}
                  >
                    <CheckCircle2 size={12} /> Authorize Draft
                  </button>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Eye size={12} /> View Answer
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
