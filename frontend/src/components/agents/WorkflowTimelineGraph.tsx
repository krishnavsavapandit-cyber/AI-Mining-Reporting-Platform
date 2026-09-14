import React from 'react';
import {
  Layers,
  FileSearch,
  Search,
  Cpu,
  ShieldAlert,
  FileCheck,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { Agent, AgentName, AgentStatusType, WorkflowRecord, QualityGateDecisionType } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface WorkflowTimelineGraphProps {
  agents?: Agent[];
  activeWorkflow?: WorkflowRecord | null;
  qualityDecision?: QualityGateDecisionType | string;
  onSelectAgent?: (agentName: AgentName) => void;
  onInspectWorkflow?: (workflowId: string) => void;
}

interface PipelineNode {
  name: AgentName;
  stageNum: number;
  label: string;
  role: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dependsOn: AgentName[];
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    name: 'ManagerAgent',
    stageNum: 1,
    label: 'Manager & Planner',
    role: 'DAG Planning & Dispatch',
    icon: Layers,
    dependsOn: [],
  },
  {
    name: 'DocumentIntelligenceAgent',
    stageNum: 2,
    label: 'Doc Intelligence & OCR',
    role: 'Tesseract & Layout Parsing',
    icon: FileSearch,
    dependsOn: ['ManagerAgent'],
  },
  {
    name: 'RetrievalAgent',
    stageNum: 3,
    label: 'Hybrid Retrieval Engine',
    role: 'TF-IDF + Vector RRF Search',
    icon: Search,
    dependsOn: ['DocumentIntelligenceAgent'],
  },
  {
    name: 'MiningIntelligenceAgent',
    stageNum: 4,
    label: 'Mining Entity Extractor',
    role: 'Production & HEMM Facts',
    icon: Cpu,
    dependsOn: ['RetrievalAgent'],
  },
  {
    name: 'ValidationAgent',
    stageNum: 5,
    label: 'Cross-Doc Discrepancy',
    role: 'Invariant & Anomaly Audit',
    icon: ShieldAlert,
    dependsOn: ['MiningIntelligenceAgent'],
  },
  {
    name: 'QualityGovernanceAgent',
    stageNum: 6,
    label: 'ISO/IEC Quality Gate',
    role: 'Strict Grounding Audit',
    icon: ShieldCheck,
    dependsOn: ['ValidationAgent'],
  },
  {
    name: 'ReportGenerationAgent',
    stageNum: 7,
    label: 'Report Compiler',
    role: 'Executive Synthesis',
    icon: FileCheck,
    dependsOn: ['QualityGovernanceAgent'],
  },
  {
    name: 'GovernmentInquiryAgent',
    stageNum: 8,
    label: 'Parliamentary Drafter',
    role: 'Ministry Answer Formulator',
    icon: Landmark,
    dependsOn: ['QualityGovernanceAgent'],
  },
];

export const WorkflowTimelineGraph: React.FC<WorkflowTimelineGraphProps> = ({
  agents = [],
  activeWorkflow,
  qualityDecision = 'PASS',
  onSelectAgent,
  onInspectWorkflow,
}) => {
  const getAgentStatus = (name: AgentName): AgentStatusType => {
    const found = agents.find((a) => a.name === name);
    return found ? found.status : 'IDLE';
  };

  const getAgentMetrics = (name: AgentName): { processed: number; errors: number } => {
    const found = agents.find((a) => a.name === name);
    return {
      processed: found ? found.tasks_processed : 0,
      errors: found ? found.errors : 0,
    };
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-level-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              8-Agent Autonomous Pipeline & Governance DAG
            </h3>
            <Badge variant="teal">DETERMINISTIC CONCURRENCY</Badge>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Sequential multi-agent handoffs with ISO/IEC 25010 Quality Gate verification and mandatory HITL sign-off.
          </span>
        </div>

        {activeWorkflow && (
          <div
            onClick={() => onInspectWorkflow && onInspectWorkflow(activeWorkflow.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline-alt)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Workflow:</span>
            <span className="text-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {activeWorkflow.id}
            </span>
            <Badge variant={activeWorkflow.status === 'COMPLETED' ? 'primary' : 'warning'}>
              {activeWorkflow.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Interactive Horizontal Pipeline Nodes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          position: 'relative',
        }}
      >
        {PIPELINE_NODES.map((node) => {
          const status = getAgentStatus(node.name);
          const metrics = getAgentMetrics(node.name);
          const Icon = node.icon;

          const isRunning = status === 'RUNNING' || status === 'BUSY';
          const isFailed = status === 'FAILED';
          const isQualityNode = node.name === 'QualityGovernanceAgent';

          let nodeBorder = 'var(--border-hairline)';
          let nodeBg = 'var(--bg-surface-2)';

          if (isRunning) {
            nodeBorder = 'var(--accent-primary)';
            nodeBg = 'rgba(31, 138, 92, 0.08)';
          } else if (isFailed) {
            nodeBorder = 'var(--status-error)';
            nodeBg = 'rgba(192, 57, 43, 0.08)';
          } else if (isQualityNode) {
            nodeBorder = 'var(--accent-teal)';
            nodeBg = 'rgba(45, 156, 168, 0.06)';
          }

          return (
            <div
              key={node.name}
              onClick={() => onSelectAgent && onSelectAgent(node.name)}
              style={{
                backgroundColor: nodeBg,
                border: `1px solid ${nodeBorder}`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: onSelectAgent ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Stage Counter & Status Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="text-mono"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                  }}
                >
                  STAGE 0{node.stageNum}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    className={`status-dot ${
                      isRunning
                        ? 'status-dot-success'
                        : isFailed
                        ? 'status-dot-error'
                        : 'status-dot-muted'
                    }`}
                  />
                  <span
                    className="text-mono"
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: isRunning ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {status}
                  </span>
                </div>
              </div>

              {/* Node Title & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isRunning ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {node.label}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {node.role}
                  </div>
                </div>
              </div>

              {/* Throughput & Reliability */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-hairline)',
                  paddingTop: '6px',
                  marginTop: '2px',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Throughput</span>
                <span className="text-mono" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {metrics.processed} tasks
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quality Gate Checkpoint Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'var(--bg-surface-2)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            Statutory Gate Status:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {qualityDecision === 'PASS' ? 'PASSED — All 8 invariants verified' : qualityDecision}
            </strong>
          </span>
        </div>

        <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Stage 6 Quality Gate enforces evidence-grounded compliance
        </span>
      </div>
    </div>
  );
};
