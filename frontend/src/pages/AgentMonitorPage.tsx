import React, { useState, useEffect } from 'react';
import {
  Network,
  RefreshCw,
  Play,
  Pause,
  Eye,
  ShieldCheck,
  FileText,
  Search,
  Bot,
  ShieldAlert,
  FileCheck,
  Landmark,
  ArrowRight,
  Zap,
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

interface AgentMetadataDetails {
  tier: 'Orchestration' | 'Ingestion & Extraction' | 'Validation & Governance' | 'Synthesis & Output';
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  roleDescription: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const AGENT_SPEC_MAP: Record<string, AgentMetadataDetails> = {
  ManagerAgent: {
    tier: 'Orchestration',
    inputs: ['User prompt / API query', 'Subsidiary filter', 'Task DAG specification'],
    outputs: ['Task execution graph', 'Worker assignments', 'Aggregated pipeline result'],
    dependencies: ['None (Root DAG Planner)'],
    roleDescription: 'Primary orchestrator responsible for task decomposition, dependency sequencing, and worker dispatch.',
    icon: Network,
  },
  DocumentIntelligenceAgent: {
    tier: 'Ingestion & Extraction',
    inputs: ['Raw PDF, DOCX, XLSX files', 'Scanned image payloads'],
    outputs: ['Extracted plaintext', 'Chunked passages (512 tokens)', 'SHA-256 hashes'],
    dependencies: ['ManagerAgent'],
    roleDescription: 'Ingests statutory mining documents, executes multi-format parsing & OCR, and generates structured document chunks.',
    icon: FileText,
  },
  SemanticRetrievalAgent: {
    tier: 'Ingestion & Extraction',
    inputs: ['Query terms', 'Subsidiary filters', 'Document vector indices'],
    outputs: ['RRF Ranked evidence chunks', 'Cosine similarity scores', 'Page provenance'],
    dependencies: ['DocumentIntelligenceAgent'],
    roleDescription: 'Executes hybrid reciprocal rank fusion (sublinear TF-IDF + dense cosine vector embeddings).',
    icon: Search,
  },
  MiningIntelligenceAgent: {
    tier: 'Ingestion & Extraction',
    inputs: ['Retrieved chunks', 'Geological schemas', 'Production entities'],
    outputs: ['Structured mining facts (Coal MT, OBR, Seams)', 'Normalized metrics'],
    dependencies: ['SemanticRetrievalAgent'],
    roleDescription: 'Domain-specialized extraction agent extracting production targets, HEMM availability, and DGMS safety metrics.',
    icon: Bot,
  },
  DiscrepancyAgent: {
    tier: 'Validation & Governance',
    inputs: ['Extracted facts across multiple documents', 'Time-series invariants'],
    outputs: ['Flagged numerical conflicts', 'Variance percentage', 'Source A vs B comparison'],
    dependencies: ['MiningIntelligenceAgent'],
    roleDescription: 'Cross-document anomaly detector comparing monthly summaries, statutory returns, and survey reports.',
    icon: ShieldAlert,
  },
  QualityGovernanceAgent: {
    tier: 'Validation & Governance',
    inputs: ['Synthesized answers', 'Discrepancy records', 'ISO/IEC 25010 benchmarks'],
    outputs: ['PASS / WARNING / FAIL decision', 'Evidence sufficiency score', 'Grounding verdict'],
    dependencies: ['DiscrepancyAgent'],
    roleDescription: 'Enforces evidence-grounded response gating, factual consistency, and ISO 25010 compliance before synthesis.',
    icon: ShieldCheck,
  },
  ReportGenerationAgent: {
    tier: 'Synthesis & Output',
    inputs: ['Approved mining facts', 'Quality gate tokens', 'Report templates'],
    outputs: ['Formal Executive Report draft', 'PDF/DOCX artifact', 'Watermark ready payload'],
    dependencies: ['QualityGovernanceAgent'],
    roleDescription: 'Synthesizes executive narratives, tables, and comparative charts into formal CIL reporting documents.',
    icon: FileCheck,
  },
  ParliamentaryInquiryAgent: {
    tier: 'Synthesis & Output',
    inputs: ['Starred/Unstarred question text', 'Ministry body metadata', 'Ground truth facts'],
    outputs: ['Drafted parliamentary response', 'Evidence citations', 'Officer sign-off block'],
    dependencies: ['QualityGovernanceAgent'],
    roleDescription: 'Formulates precise, evidence-grounded answers for Lok Sabha / Rajya Sabha Ministry of Coal inquiries.',
    icon: Landmark,
  },
};

export const AgentMonitorPage: React.FC<AgentMonitorPageProps> = ({ onInspectWorkflow }) => {
  const { role, canExecuteWorkflows } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [selectedAgentName, setSelectedAgentName] = useState<string>('ManagerAgent');
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

      if (agRes.status === 'fulfilled') {
        const agList = agRes.value.agents || [];
        setAgents(agList);
        if (agList.length > 0 && !agList.some((a) => a.name === selectedAgentName)) {
          setSelectedAgentName(agList[0].name);
        }
      }
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

  const activeAgentData = agents.find((a) => a.name === selectedAgentName) || agents[0];
  const activeAgentSpec = activeAgentData ? AGENT_SPEC_MAP[activeAgentData.name] || AGENT_SPEC_MAP.ManagerAgent : AGENT_SPEC_MAP.ManagerAgent;
  const ActiveAgentIcon = activeAgentSpec.icon;

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
              backgroundColor: 'rgba(31, 138, 92, 0.12)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Network size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              8-Agent Autonomous Multi-Agent Orchestration
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Manager-Worker concurrent agent pipeline with DAG provenance, quality gating, and deterministic handoffs.
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

      {/* 1. Coordinated Intelligence Pipeline Stages Banner */}
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
            <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              AUTONOMOUS DAG ORCHESTRATION PIPELINE
            </span>
          </div>
          <Badge variant="teal">DETERMINISTIC HANDOFFS</Badge>
        </div>

        {/* Step-by-step Flow Visualizer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            alignItems: 'stretch',
          }}
        >
          {[
            { step: '01', title: 'Task Ingestion', subtitle: 'Query / Upload Trigger', color: 'var(--text-muted)' },
            { step: '02', title: 'Manager Planner', subtitle: 'Task DAG Decomposition', color: 'var(--accent-primary)' },
            { step: '03', title: 'Extraction & Search', subtitle: 'OCR, Vector RRF, Mining Facts', color: 'var(--accent-teal)' },
            { step: '04', title: 'Discrepancy Audit', subtitle: 'Cross-Doc Invariant Scan', color: 'var(--status-warning)' },
            { step: '05', title: 'Quality Gate', subtitle: 'ISO/IEC 25010 Verification', color: 'var(--accent-primary)' },
            { step: '06', title: 'Synthesis & Sign-Off', subtitle: 'Reports / Parliamentary PQ', color: 'var(--text-primary)' },
          ].map((st, i) => (
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
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-mono" style={{ fontSize: 10, fontWeight: 700, color: st.color }}>
                  STAGE {st.step}
                </span>
                {i < 5 && <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{st.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{st.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Progressive Disclosure: 8 Registered Agents + Deep Agent Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: 24 }}>
        {/* Left: 8 Agent Cards with Grouping */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Registered Pipeline Agents ({agents.length})
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click an agent to inspect inputs, outputs & dependencies</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {agents.map((ag) => {
              const isSelected = selectedAgentName === ag.name;
              const spec = AGENT_SPEC_MAP[ag.name] || AGENT_SPEC_MAP.ManagerAgent;
              const IconComp = spec.icon;

              return (
                <div
                  key={ag.name}
                  onClick={() => setSelectedAgentName(ag.name)}
                  style={{
                    padding: '14px',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconComp size={16} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--accent-teal)' }} />
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ag.name}</strong>
                    </div>
                    <Badge variant={ag.status === 'IDLE' ? 'slate' : 'primary'}>{ag.status}</Badge>
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {spec.tier}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {ag.description}
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
                    <span style={{ color: 'var(--text-muted)' }}>Tasks: {ag.tasks_processed}</span>
                    <span className="text-mono" style={{ color: ag.errors > 0 ? 'var(--status-error)' : 'var(--accent-primary)' }}>
                      {ag.errors} err
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Deep Agent Inspector */}
        {activeAgentData && (
          <div
            className="card-level-1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              border: '1px solid var(--border-hairline-alt)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <ActiveAgentIcon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {activeAgentData.name}
                  </h4>
                  <span style={{ fontSize: 11, color: 'var(--accent-teal)' }}>
                    {activeAgentSpec.tier} Tier
                  </span>
                </div>
              </div>
              <Badge variant="primary">{activeAgentData.status}</Badge>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {activeAgentSpec.roleDescription}
            </div>

            {/* Inputs & Outputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  EXPECTED INPUTS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {activeAgentSpec.inputs.map((inp, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        backgroundColor: 'var(--bg-surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      • {inp}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PRODUCED OUTPUTS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {activeAgentSpec.outputs.map((out, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        backgroundColor: 'var(--bg-surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ✓ {out}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  UPSTREAM DEPENDENCIES
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {activeAgentSpec.dependencies.map((dep, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-surface-3)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ACTIVE CAPABILITIES
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {activeAgentData.capabilities?.map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      backgroundColor: 'rgba(20, 184, 166, 0.12)',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-teal)',
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                padding: '10px',
                backgroundColor: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>THROUGHPUT</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeAgentData.tasks_processed} tasks
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>FAULT RATE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: activeAgentData.errors > 0 ? 'var(--status-error)' : 'var(--accent-primary)' }}>
                  {activeAgentData.errors} errors
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Dispatched Multi-Agent Workflows History Queue */}
      <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Dispatched Multi-Agent Workflows & DAG Provenance</h3>
            <span className="card-subtitle">Click any workflow to inspect its full interactive execution DAG</span>
          </div>
          <Badge variant="primary">{workflows.length} DISPATCHED JOBS</Badge>
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
