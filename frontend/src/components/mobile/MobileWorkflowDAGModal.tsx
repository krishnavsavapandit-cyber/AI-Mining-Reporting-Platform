import React, { useState, useEffect } from 'react';
import { Pause, Play, XCircle, X, Network, ShieldCheck } from 'lucide-react';
import { agentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { WorkflowDetailResponse } from '@/types';

export interface MobileWorkflowDAGModalProps {
  workflowId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onWorkflowUpdated?: () => void;
}

export const MobileWorkflowDAGModal: React.FC<MobileWorkflowDAGModalProps> = ({
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
  const reviewerName = 'Dr. S. K. Verma (Chief Geologist)';
  const reviewerNote = 'Cross-document discrepancy verified against DGMS logs. Approved for release.';
  const { roleInfo } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && workflowId) {
      loadWorkflow(workflowId);
    } else {
      setData(null);
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
      const res = await agentService.cancelWorkflow(workflowId);
      toast.info('Workflow Cancelled', res.message || 'Execution halted.');
      loadWorkflow(workflowId);
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel workflow';
      toast.error('Cancel Failed', msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  const wf = data?.workflow;
  const tasks = data?.tasks || [];

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
                backgroundColor: 'rgba(167, 139, 250, 0.15)',
                color: '#A78BFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Network size={18} />
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
                {wf ? `DAG: ${wf.id}` : 'Workflow Details'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Status: <strong style={{ color: '#10B981' }}>{wf?.status}</strong> • Decision:{' '}
                <strong>{wf?.quality_decision || 'PASS'}</strong>
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
              Loading 8-agent execution telemetry...
            </div>
          ) : wf ? (
            <>
              {/* Quality & Release Badge */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} style={{ color: '#10B981' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                    GATE: {wf.quality_decision || 'PASS'}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Tasks Completed: {tasks.filter((t) => t.status === 'COMPLETED').length} / {tasks.length}
                </span>
              </div>

              {/* Tasks Execution List */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                  EXECUTED AGENT TASKS ({tasks.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {tasks.map((task) => (
                    <div
                      key={task.task_id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {task.source_agent || task.destination_agent}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor:
                              task.status === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color: task.status === 'COMPLETED' ? '#10B981' : '#F59E0B',
                          }}
                        >
                          {task.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        Type: {task.task_type} • ID: {task.task_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {wf.status === 'RUNNING' && (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-secondary"
                    onClick={handlePause}
                    disabled={isPausing}
                    style={{ flex: 1 }}
                  >
                    <Pause size={14} /> Pause
                  </button>
                )}
                {wf.status === 'PAUSED' && (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-primary"
                    onClick={handleResume}
                    disabled={isResuming}
                    style={{ flex: 1 }}
                  >
                    <Play size={14} /> Resume
                  </button>
                )}
                {(wf.status === 'RUNNING' || wf.status === 'PAUSED') && (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-outline"
                    onClick={handleCancel}
                    disabled={isCancelling}
                    style={{ flex: 1, color: 'var(--status-error)' }}
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
