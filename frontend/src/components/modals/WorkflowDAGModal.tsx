import React, { useState, useEffect } from 'react';
import { Network, Pause, Play, XCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QualityGateHero } from '@/components/ui/QualityGateHero';
import { WorkflowTimelineGraph } from '@/components/agents/WorkflowTimelineGraph';
import { agentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { WorkflowDetailResponse } from '@/types';

export interface WorkflowDAGModalProps {
  workflowId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onWorkflowUpdated?: () => void;
}

export const WorkflowDAGModal: React.FC<WorkflowDAGModalProps> = ({
  workflowId,
  isOpen,
  onClose,
  onWorkflowUpdated,
}) => {
  const [data, setData] = useState<WorkflowDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [reviewerName, setReviewerName] = useState('Dr. S. K. Verma (Chief Geologist)');
  const [reviewerNote, setReviewerNote] = useState('Cross-document discrepancy verified against DGMS logs. Approved for release.');
  const { roleInfo } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && workflowId) {
      loadWorkflow(workflowId);
    } else {
      setData(null);
      setShowResumeForm(false);
    }
  }, [isOpen, workflowId]);

  const loadWorkflow = async (id: string) => {
    setLoading(true);
    try {
      const res = await agentService.getWorkflow(id);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch workflow';
      toast.error('Workflow Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!workflowId) return;
    setIsResuming(true);
    try {
      const res = await agentService.resumeWorkflow(workflowId, {
        reviewer: reviewerName,
        reviewer_role: roleInfo.role,
        reviewer_note: reviewerNote,
      });
      toast.success('Workflow Resumed', res.message || 'Workflow transitioned back to RUNNING.');
      setShowResumeForm(false);
      loadWorkflow(workflowId);
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resume workflow';
      toast.error('Resume Failed', msg);
    } finally {
      setIsResuming(false);
    }
  };

  const handlePause = async () => {
    if (!workflowId) return;
    setIsPausing(true);
    try {
      const res = await agentService.pauseWorkflow(workflowId, {
        reason: 'Human verification requested via multi-agent monitor console.',
      });
      toast.warning('Workflow Paused', res.message || 'Workflow checkpoint saved for human review.');
      loadWorkflow(workflowId);
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to pause workflow';
      toast.error('Pause Failed', msg);
    } finally {
      setIsPausing(false);
    }
  };

  const handleCancel = async () => {
    if (!workflowId) return;
    if (!window.confirm(`Are you sure you want to cancel workflow '${workflowId}'?`)) return;
    setIsCancelling(true);
    try {
      await agentService.cancelWorkflow(workflowId);
      toast.info('Workflow Cancelled', `Workflow ${workflowId} marked as CANCELLED.`);
      loadWorkflow(workflowId);
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel workflow';
      toast.error('Cancellation Error', msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  const wf = data?.workflow;
  const isPaused = wf?.status === 'PAUSED' || wf?.status === 'REQUIRES_HUMAN_REVIEW';
  const isRunning = wf?.status === 'RUNNING';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Network size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>
            8-Agent Orchestration DAG: {wf ? `${wf.workflow_type} [${wf.id}]` : 'Workflow Inspection'}
          </span>
          {wf && (
            <Badge
              variant={
                wf.status === 'COMPLETED'
                  ? 'primary'
                  : wf.status === 'FAILED' || wf.status === 'REJECTED'
                  ? 'error'
                  : 'warning'
              }
            >
              {wf.status}
            </Badge>
          )}
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            {isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                loading={isPausing}
                icon={<Pause size={12} />}
              >
                Pause for HITL Review
              </Button>
            )}
            {isPaused && !showResumeForm && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowResumeForm(true)}
                icon={<Play size={12} />}
              >
                Resume Workflow (HITL Sign-Off)
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {isRunning && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                loading={isCancelling}
                icon={<XCircle size={12} />}
              >
                Cancel Execution
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading DAG execution graph & provenance state...
        </div>
      ) : wf ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* HITL Resume Approval Form */}
          {showResumeForm && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Human-in-the-Loop (HITL) Statutory Approval
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Officer verification is required to resume paused execution and finalize report distribution.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Reviewer Name & Designation
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="input-text"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Reviewer Role (RBAC)
                  </label>
                  <input
                    type="text"
                    value={roleInfo.name}
                    disabled
                    className="input-text"
                    style={{ fontSize: 12, opacity: 0.8 }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Sign-Off Justification Note
                </label>
                <textarea
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  className="input-textarea"
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" onClick={() => setShowResumeForm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResume}
                  loading={isResuming}
                  icon={<CheckCircle2 size={12} />}
                >
                  Confirm & Resume Pipeline
                </Button>
              </div>
            </div>
          )}

          {/* Quality Gate Hero */}
          <QualityGateHero
            decision={wf.quality_decision || 'PASS'}
            violations={data?.quality_report?.violations}
            warnings={data?.quality_report?.warnings}
            checksPassed={data?.quality_report?.checks_passed}
            evaluatedBy="QualityGovernanceAgent"
          />

          {/* Visual Execution Timeline & Dependency Graph */}
          <WorkflowTimelineGraph
            activeWorkflow={wf}
            qualityDecision={wf.quality_decision || 'PASS'}
          />

          {/* Task Results Breakdown */}
          <div className="card-level-1">
            <div className="card-header-clean">
              <h4 className="card-title" style={{ fontSize: 13 }}>
                Task Results & Intermediate Provenance
              </h4>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {data?.results_count || 0} agent outputs recorded
              </span>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {data?.results && data.results.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.results.map((r, rIdx) => (
                    <div
                      key={r.id || rIdx}
                      style={{
                        padding: 10,
                        backgroundColor: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{r.agent_name}</strong>
                          <Badge variant={r.status === 'COMPLETED' ? 'primary' : 'error'}>
                            {r.status}
                          </Badge>
                        </div>
                        <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {r.duration_ms ? `${r.duration_ms}ms` : ''}
                        </span>
                      </div>
                      {r.errors && r.errors.length > 0 && (
                        <div style={{ color: 'var(--status-error)', fontSize: 11 }}>
                          Error: {r.errors.join(', ')}
                        </div>
                      )}
                      {r.evidence && r.evidence.length > 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>
                          Evidence: {r.evidence.length} grounding chunks cited.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No intermediate results captured yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
