import React, { useState, useEffect } from 'react';
import {
  Network,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { agentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { Agent, WorkflowRecord } from '@/types';

interface AgentMonitorPageProps {
  onInspectWorkflow?: (id: string) => void;
}

export const AgentMonitorPage: React.FC<AgentMonitorPageProps> = ({ onInspectWorkflow }) => {
  const { role, canExecuteWorkflows } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringDemo, setTriggeringDemo] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadAgentsAndWorkflows();
  }, []);

  const loadAgentsAndWorkflows = async () => {
    setLoading(true);
    try {
      const [agRes, wfRes] = await Promise.allSettled([
        agentService.getAgents(),
        agentService.getWorkflows({ limit: 15 }),
      ]);

      if (agRes.status === 'fulfilled') setAgents(agRes.value.agents || []);
      if (wfRes.status === 'fulfilled') setWorkflows(wfRes.value.workflows || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading agents';
      toast.error('Agent Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDemo = async () => {
    setTriggeringDemo(true);
    toast.info('Dispatching Multi-Agent DAG', 'Executing Rajmahal production discrepancy workflow...');
    try {
      await agentService.runRajmahalDemo();
      toast.success('DAG Completed', 'Multi-agent orchestration executed successfully.');
      loadAgentsAndWorkflows();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      toast.error('Workflow Error', msg);
    } finally {
      setTriggeringDemo(false);
    }
  };

  const handlePause = async (wfId: string) => {
    try {
      await agentService.pauseWorkflow(wfId, { reason: 'Manual operator pause' });
      toast.info('Workflow Paused', `Workflow ${wfId} state preserved.`);
      loadAgentsAndWorkflows();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pause failed';
      toast.error('Pause Error', msg);
    }
  };

  const handleResume = async (wfId: string) => {
    try {
      await agentService.resumeWorkflow(wfId, { reviewer: `Operator (${role})` });
      toast.success('Workflow Resumed', `Workflow ${wfId} resumed execution.`);
      loadAgentsAndWorkflows();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resume failed';
      toast.error('Resume Error', msg);
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
              backgroundColor: 'rgba(31, 138, 92, 0.1)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Network size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              8-Agent Autonomous Multi-Agent Orchestration
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Manager-Worker concurrent agent pipeline with DAG provenance and quality gate handoffs.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canExecuteWorkflows && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunDemo}
              loading={triggeringDemo}
              icon={<Play size={13} />}
            >
              Dispatch Rajmahal Discrepancy DAG
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadAgentsAndWorkflows}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* 8 Registered Agents Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Registered Autonomous Worker Agents ({agents.length})
          </h3>
          <Badge variant="teal">ALL 8 WORKERS READY</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {agents.map((ag) => {
            const isIdle = ag.status === 'IDLE';
            return (
              <div key={ag.name} className="card-level-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cpu size={16} style={{ color: 'var(--accent-primary)' }} />
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ag.name}</strong>
                  </div>
                  <Badge variant={isIdle ? 'slate' : 'primary'}>{ag.status}</Badge>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {ag.description}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ag.capabilities?.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        backgroundColor: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-hairline)',
                    paddingTop: 8,
                    marginTop: 2,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Throughput: {ag.tasks_processed} tasks</span>
                  <span className="text-mono" style={{ color: ag.errors > 0 ? 'var(--status-error)' : 'var(--accent-primary)' }}>
                    {ag.errors} errors
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflows Execution History Table */}
      <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Dispatched Multi-Agent Workflows</h3>
            <span className="card-subtitle">Click any workflow to inspect its full interactive DAG execution graph</span>
          </div>
          <Badge variant="primary">{workflows.length} DISPATCHED</Badge>
        </div>

        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>Workflow ID</th>
                <th>Intent / Type</th>
                <th>Prompt / Query</th>
                <th>Quality Gate</th>
                <th>Status</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr
                  key={wf.id}
                  onClick={() => onInspectWorkflow && onInspectWorkflow(wf.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {wf.id}
                  </td>
                  <td>
                    <Badge variant="teal">{wf.workflow_type}</Badge>
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {wf.initial_prompt}
                  </td>
                  <td>
                    <Badge
                      variant={
                        wf.quality_decision === 'PASS'
                          ? 'primary'
                          : wf.quality_decision === 'WARNING'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {wf.quality_decision || 'PASS'}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      variant={
                        wf.status === 'COMPLETED'
                          ? 'primary'
                          : wf.status === 'RUNNING'
                          ? 'teal'
                          : wf.status === 'PAUSED'
                          ? 'warning'
                          : 'slate'
                      }
                    >
                      {wf.status}
                    </Badge>
                  </td>
                  <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {wf.duration_seconds ? `${wf.duration_seconds.toFixed(2)}s` : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectWorkflow && onInspectWorkflow(wf.id);
                        }}
                        icon={<Eye size={12} />}
                        style={{ padding: '3px 8px' }}
                      >
                        DAG
                      </Button>

                      {canExecuteWorkflows && wf.status === 'RUNNING' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePause(wf.id);
                          }}
                          icon={<Pause size={12} />}
                          style={{ padding: '3px 8px' }}
                        >
                          Pause
                        </Button>
                      )}

                      {canExecuteWorkflows && wf.status === 'PAUSED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResume(wf.id);
                          }}
                          icon={<Play size={12} />}
                          style={{ padding: '3px 8px' }}
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
