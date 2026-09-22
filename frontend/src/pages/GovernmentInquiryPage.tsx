import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
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
      const fetched = res.inquiries || [];
      setInquiries(fetched);
      if (fetched.length > 0) {
        if (!selectedInquiry || !fetched.some((i) => i.id === selectedInquiry.id)) {
          setSelectedInquiry(fetched[0]);
        }
      } else {
        setSelectedInquiry(null);
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

  // Helper to parse citations safely
  const parseCitations = (inq: InquiryRecord): Array<{ document_name?: string; page_number?: number }> => {
    if (!inq.citations_json) return [];
    try {
      const parsed = JSON.parse(inq.citations_json);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  };

  const citationsList = selectedInquiry ? parseCitations(selectedInquiry) : [];

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
              backgroundColor: 'rgba(217, 164, 65, 0.12)',
              border: '1px solid var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-warning)',
            }}
          >
            <Landmark size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Parliamentary Question & Government Inquiry Formulation
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Draft formal parliamentary responses to Lok Sabha / Rajya Sabha questions with mandatory source document citations.
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

      {/* 1. Parliamentary Inquiry Workflow Banner (Summary) */}
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
            <Zap size={16} style={{ color: 'var(--status-warning)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              PARLIAMENTARY QUESTION GROUNDING & AUTHORIZATION WORKFLOW
            </span>
          </div>
          <Badge variant="teal">STRICT GROUNDING GATED</Badge>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
          }}
        >
          {[
            { step: '01', title: 'Inquiry Ingestion', desc: 'Starred PQ Reference' },
            { step: '02', title: 'Classification', desc: 'Subject & Ministry Body' },
            { step: '03', title: 'Evidence Retrieval', desc: 'Hybrid RRF Multi-Pass' },
            { step: '04', title: 'Response Grounding', desc: 'Strict Fact Synthesis' },
            { step: '05', title: 'Officer Sign-Off', desc: 'Official Ministry Seal' },
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
                <span className="text-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--status-warning)' }}>
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

      {/* Formulate Inquiry Form */}
      {showForm && (
        <div className="card-level-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              Formulate Ministry Parliamentary Response
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Select a quick template or enter custom question
            </span>
          </div>

          {/* Quick Template Pills */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              ⚡ 1-CLICK QUESTION TEMPLATES:
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => {
                  setQuestionText('What is the raw coal production achievement and target shortfall for BCCL and ECL in the current fiscal year?');
                  setInquiryRef('LS-STARRED-PQ-142');
                }}
              >
                📊 Production Shortfall & Targets
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => {
                  setQuestionText('What is the total overburden removal volume (OBR) and current stripping ratio across open cast mines?');
                  setInquiryRef('RS-UNSTARRED-288');
                }}
              >
                🚜 OBR & Stripping Ratios
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => {
                  setQuestionText('What are the documented DGMS mine safety audit findings, statutory inspections, and compliance actions taken?');
                  setInquiryRef('MOC-VIP-REF-904');
                }}
              >
                🛡️ DGMS Safety Compliance
              </button>
            </div>
          </div>

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
                  className="input-field"
                  placeholder="e.g. STARRED-PQ-142"
                  required
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
                  className="input-field"
                  placeholder="e.g. Lok Sabha / Ministry of Coal"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                PARLIAMENTARY QUESTION TEXT
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Enter exact question raised in Parliament..."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={drafting} icon={<ShieldCheck size={13} />}>
                Draft Grounded Response
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Parliamentary Inquiries Queue & Workspace (Analysis & Detail) */}
      {inquiries.length === 0 && !loading ? (
        <EmptyState
          type="search"
          title="No Parliamentary Inquiries Logged"
          description="Formulate grounded answers to starred and unstarred parliamentary questions from verified CIL data."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(380px, 1fr)', gap: 24 }}>
          {/* Left: Inquiries List (Analysis) */}
          <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">Inquiries Registry</h3>
                <span className="card-subtitle">Select inquiry to inspect drafted response and evidence</span>
              </div>
              <Badge variant="warning">{inquiries.length} LOGGED</Badge>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      {inq.human_approved ? (
                        <Badge variant="primary" icon={<ShieldCheck size={11} />}>
                          AUTHORIZED
                        </Badge>
                      ) : (
                        <Badge variant="warning" icon={<Clock size={11} />}>
                          AWAITING SIGN-OFF
                        </Badge>
                      )}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {inq.question_text}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {inq.ministry_body} • {inq.created_at?.split(' ')[0] || 'Recent'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Inquiry Formulation & Detail Workspace (Detail & Action) */}
          {selectedInquiry ? (
            <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Structured Header with Clean Badges & Hierarchy */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderBottom: '1px solid var(--border-hairline)',
                  paddingBottom: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      className="text-mono"
                      style={{
                        fontWeight: 800,
                        color: 'var(--accent-primary)',
                        fontSize: 13,
                        padding: '4px 10px',
                        backgroundColor: 'rgba(31, 138, 92, 0.12)',
                        border: '1px solid rgba(31, 138, 92, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {selectedInquiry.inquiry_ref}
                    </span>
                    <Badge variant="slate">{selectedInquiry.ministry_body}</Badge>
                  </div>

                  <div>
                    {selectedInquiry.human_approved ? (
                      <Badge variant="primary" icon={<ShieldCheck size={12} />}>
                        AUTHORIZED FOR DISPATCH
                      </Badge>
                    ) : (
                      <Badge variant="warning" icon={<Clock size={12} />}>
                        REVIEW REQUIRED
                      </Badge>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} style={{ color: 'var(--accent-teal)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Formulated with evidence-grounded response gating
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PARLIAMENTARY QUESTION
                </span>
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 4,
                  }}
                >
                  {selectedInquiry.question_text}
                </div>
              </div>

              {/* Synthesized Response */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  GROUNDED MINISTRY RESPONSE DRAFT
                </span>
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    marginTop: 4,
                  }}
                >
                  {selectedInquiry.generated_response || selectedInquiry.draft_response || 'Synthesizing response from verified mining facts...'}
                </div>
              </div>

              {/* Evidence Citations */}
              {citationsList.length > 0 && (
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    GROUNDED SOURCE EVIDENCE ({citationsList.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {citationsList.map((ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-surface-3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={12} style={{ color: 'var(--accent-primary)' }} />
                          <strong style={{ color: 'var(--text-primary)' }}>{ev.document_name || 'Document Chunk'}</strong>
                        </div>
                        {ev.page_number && (
                          <span className="text-mono" style={{ color: 'var(--accent-teal)' }}>
                            Page {ev.page_number}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Officer Sign-off Action (Action) */}
              {!selectedInquiry.human_approved && canApprove && (
                <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleApprove(selectedInquiry.id)}
                    icon={<CheckCircle2 size={14} />}
                  >
                    Authorize & Seal Answer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="card-level-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Select a parliamentary inquiry from the registry to view drafted answer and citations.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
