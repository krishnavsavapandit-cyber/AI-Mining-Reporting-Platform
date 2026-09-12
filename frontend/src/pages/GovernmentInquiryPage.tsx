import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { inquiryService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { InquiryRecord } from '@/types';

export const GovernmentInquiryPage: React.FC = () => {
  const { role, canApprove, isViewer } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [questionText, setQuestionText] = useState('');
  const [inquiryRef, setInquiryRef] = useState('STARRED-PQ-142');
  const [ministryBody, setMinistryBody] = useState('Lok Sabha / Ministry of Coal');

  const toast = useToast();

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const res = await inquiryService.getInquiries();
      setInquiries(res.inquiries || []);
      if (res.inquiries && res.inquiries.length > 0 && !selectedInquiry) {
        setSelectedInquiry(res.inquiries[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading inquiries';
      toast.error('Inquiry Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setDrafting(true);
    toast.info('Drafting Parliamentary Answer', 'Retrieving evidence chunks and grounding answer...');
    try {
      const res = await inquiryService.generateInquiry({
        question_text: questionText,
        inquiry_ref: inquiryRef,
        ministry_body: ministryBody,
      });
      toast.success('Inquiry Drafted', 'Response synthesized with source document citations.');
      setShowForm(false);
      setQuestionText('');
      loadInquiries();
      if (res.inquiry) {
        setSelectedInquiry(res.inquiry);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Drafting failed';
      toast.error('Inquiry Drafting Error', msg);
    } finally {
      setDrafting(false);
    }
  };

  const handleApprove = async (inquiryId: number) => {
    try {
      await inquiryService.approveInquiry(inquiryId, { approved_by: `Reviewing Officer (${role})` });
      toast.success('Inquiry Authorized', 'Parliamentary answer certified for ministry dispatch.');
      loadInquiries();
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
              backgroundColor: 'rgba(217, 164, 65, 0.1)',
              border: '1px solid var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-warning)',
            }}
          >
            <Landmark size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Parliamentary Question & Government Inquiry Formulation
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Draft formal parliamentary responses to Lok Sabha / Rajya Sabha questions with mandatory source grounding.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isViewer && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              icon={<Plus size={13} />}
            >
              {showForm ? 'Cancel Form' : 'Formulate New Inquiry'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadInquiries}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Formulate Inquiry Form */}
      {showForm && (
        <div className="card-level-2">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            Formulate Ministry Parliamentary Response
          </h3>
          <form onSubmit={handleDraft} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  PARLIAMENTARY REFERENCE NO.
                </label>
                <input
                  type="text"
                  value={inquiryRef}
                  onChange={(e) => setInquiryRef(e.target.value)}
                  placeholder="e.g. STARRED-PQ-142"
                  className="input-text"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  MINISTRY / PARLIAMENTARY BODY
                </label>
                <input
                  type="text"
                  value={ministryBody}
                  onChange={(e) => setMinistryBody(e.target.value)}
                  placeholder="e.g. Lok Sabha / Ministry of Coal"
                  className="input-text"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                PARLIAMENTARY QUESTION TEXT
              </label>
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter official parliamentary question (e.g. (a) whether there is a shortfall in coal production in ECL Rajmahal; (b) details of targets vs actuals...)"
                className="input-textarea"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={drafting} icon={<Landmark size={13} />}>
                Draft Grounded Response
              </Button>
            </div>
          </form>
        </div>
      )}

      {inquiries.length === 0 && !loading ? (
        <EmptyState
          type="search"
          title="No Parliamentary Inquiries Logged"
          description="Formulate grounded answers to starred and unstarred parliamentary questions from verified CIL data."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(380px, 1fr)', gap: 24 }}>
          {/* Left: Inquiries List */}
          <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Parliamentary Inquiries Registry</h3>
                <span className="card-subtitle">Select inquiry to inspect drafted answer and citations</span>
              </div>
              <Badge variant="warning">{inquiries.length} INQUIRIES</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {inquiries.map((inq) => {
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    style={{
                      padding: '14px',
                      backgroundColor: isSelected ? 'rgba(31, 138, 92, 0.08)' : 'var(--bg-surface-2)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="text-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)' }}>
                        {inq.inquiry_ref}
                      </span>
                      <Badge variant={inq.human_approved ? 'primary' : 'warning'}>
                        {inq.human_approved ? 'AUTHORIZED' : 'DRAFT'}
                      </Badge>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {inq.question_text}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {inq.ministry_body} • {inq.created_at?.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Inquiry Detail & Response */}
          {selectedInquiry && (
            <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card-header-clean">
                <div>
                  <h3 className="card-title">Drafted Parliamentary Response</h3>
                  <span className="card-subtitle">{selectedInquiry.inquiry_ref} • {selectedInquiry.ministry_body}</span>
                </div>
                <Badge variant={selectedInquiry.human_approved ? 'primary' : 'warning'}>
                  {selectedInquiry.human_approved ? 'OFFICIAL SEALED' : 'REQUIRES VERIFICATION'}
                </Badge>
              </div>

              {/* Watermarked Response Box */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                {selectedInquiry.generated_response}
              </div>

              {/* Sign-off Actions */}
              {canApprove && !selectedInquiry.human_approved && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedInquiry.id)}
                    icon={<CheckCircle2 size={13} />}
                  >
                    Authorize Parliamentary Response
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
