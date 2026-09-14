import React, { useState, useEffect } from 'react';
import {
  Cpu,
  FileText,
  Search,
  TrendingUp,
  Scale,
  ShieldCheck,
  FileCheck2,
  Landmark,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { agentService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { WorkflowRecord } from '@/types';
import { MobileMineCart } from '@/components/mobile/MobileMineCart';

interface MobileWorkflowViewProps {
  onInspectWorkflow?: (id: string) => void;
}

interface AgentStageConfig {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  badge: string;
  color: string;
  description: string;
  inputs: string[];
  outputs: string[];
  telemetryMetric: string;
}

const AGENT_STAGES: AgentStageConfig[] = [
  {
    id: 'ManagerAgent',
    name: '01. Manager Agent',
    role: 'Deterministic Orchestrator & Planner',
    icon: <Cpu size={18} />,
    badge: 'DAG Orchestrator',
    color: '#A78BFA',
    description: 'Deconstructs user queries into dependency-resolved execution plans, dispatches tasks to worker agents, and collects intermediate state.',
    inputs: ['User query / Request payload', 'Session clearance credentials'],
    outputs: ['8-Agent execution graph', 'State telemetry checkpoint'],
    telemetryMetric: 'Deterministic DAG Resolution',
  },
  {
    id: 'DocumentIntelligenceAgent',
    name: '02. Document Intelligence',
    role: 'Multi-Format Ingestion & Geological OCR',
    icon: <FileText size={18} />,
    badge: 'OCR & Stratigraphy',
    color: 'var(--accent-teal)',
    description: 'Extracts structural layout, borehole stratigraphy matrices, and text chunks from scanned PDFs and DOCX files with SHA-256 provenance.',
    inputs: ['Raw PDF / DOCX / CSV', 'Borehole log scans'],
    outputs: ['SHA-256 verified chunks', 'Borehole strata tables', 'OCR clean text'],
    telemetryMetric: 'PyMuPDF + Tesseract 5.x',
  },
  {
    id: 'RetrievalAgent',
    name: '03. Hybrid Retrieval Agent',
    role: 'Reciprocal Rank Fusion Search Engine',
    icon: <Search size={18} />,
    badge: 'Lexical + Vector RRF',
    color: 'var(--accent-primary)',
    description: 'Retrieves top passages using BM25/TF-IDF lexical search fused with dense cosine embeddings, returning exact coordinates.',
    inputs: ['Sub-query search strings', 'Indexed document chunks'],
    outputs: ['Top-k ranked evidence passages', 'Page & bounding-box citations'],
    telemetryMetric: 'Reciprocal Rank Fusion (RRF)',
  },
  {
    id: 'MiningIntelligenceAgent',
    name: '04. Mining Intelligence Agent',
    role: 'Domain Math & GCV G1–G17 Grading',
    icon: <TrendingUp size={18} />,
    badge: 'Coal Math & Grading',
    color: '#60A5FA',
    description: 'Normalizes mining units (MT, Lakh Te, MCuM), categorizes coal seams into G1-G17 GCV grades, and calculates Stripping Ratios.',
    inputs: ['Raw extracted facts', 'Coal volume and OBR matrices'],
    outputs: ['Normalized MT values', 'GCV grades G1-G17', 'Stripping Ratios (OBR/Coal)'],
    telemetryMetric: 'Indian Coal G1-G17 Standard',
  },
  {
    id: 'ValidationAgent',
    name: '05. Validation & Discrepancy Agent',
    role: 'Cross-Document Mathematical Conflict Engine',
    icon: <Scale size={18} />,
    badge: 'Variance Audit',
    color: 'var(--status-warning)',
    description: 'Detects numerical conflicts between daily logs, Monthly Operating Reviews, and target schedules with automatic variance scoring.',
    inputs: ['Extracted multi-source tables', 'Historical baseline records'],
    outputs: ['Discrepancy registry issues', 'Variance % delta calculations'],
    telemetryMetric: '±2.5% Variance Threshold Gate',
  },
  {
    id: 'QualityGovernanceAgent',
    name: '06. Quality & Governance Gatekeeper',
    role: 'Evidence Grounding & Release Verdicts',
    icon: <ShieldCheck size={18} />,
    badge: 'Release Gatekeeper',
    color: '#10B981',
    description: 'Independently inspects synthesis outputs, verifying sufficient citations and preventing hallucinations before issuing PASS/REJECT verdicts.',
    inputs: ['Generated responses', 'Evidence citation passages'],
    outputs: ['PASS / REQUIRES_HUMAN_REVIEW / REJECT release verdict'],
    telemetryMetric: 'No-Hallucination Invariant Check',
  },
  {
    id: 'ReportGenerationAgent',
    name: '07. Report Generation Agent',
    role: 'Executive & Statutory Synthesis',
    icon: <FileCheck2 size={18} />,
    badge: 'Statutory Reports',
    color: '#F472B6',
    description: 'Compiles multi-source findings into executive summaries and DGMS compliance drafts with draft watermarks.',
    inputs: ['Validated mining data', 'Quality release verdict'],
    outputs: ['Draft executive reports', 'PDF / DOCX export documents'],
    telemetryMetric: 'DGMS Statutory Standard Format',
  },
  {
    id: 'GovernmentInquiryAgent',
    name: '08. Parliamentary Inquiry Agent',
    role: 'Ministry of Coal Question Formulation',
    icon: <Landmark size={18} />,
    badge: 'Parliamentary Answers',
    color: '#F59E0B',
    description: 'Formulates official parliamentary answers for Lok Sabha / Rajya Sabha starred questions strictly grounded in audited records.',
    inputs: ['Parliamentary question query', 'Audited historical records'],
    outputs: ['Official inquiry response drafts', 'Ministerial briefing notes'],
    telemetryMetric: 'Evidence-Grounded Response Gating',
  },
];

export const MobileWorkflowView: React.FC<MobileWorkflowViewProps> = ({ onInspectWorkflow }) => {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>('ManagerAgent');
  const toast = useToast();

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      const wfRes = await agentService.getWorkflows({ limit: 5 });
      setWorkflows(wfRes.workflows || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleRunDemo = async () => {
    setRunningDemo(true);
    toast.info('Dispatching Demo', 'Running 8-Agent Rajmahal production discrepancy workflow...');
    try {
      await agentService.runRajmahalDemo();
      toast.success('DAG Complete', 'All 8 agents executed successfully.');
      loadWorkflowData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Workflow failed';
      toast.error('Workflow Error', msg);
    } finally {
      setRunningDemo(false);
    }
  };

  const activeWf = workflows[0];

  return (
    <div className="mobile-main-viewport">
      {/* 1. Mine Cart Pipeline Hero */}
      <MobileMineCart />

      {/* 2. Autonomous DAG Execution Header & Controls */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div>
            <h3 className="mobile-card-title">8-Agent Multi-Agent System</h3>
            <p className="mobile-card-subtitle">Deterministic Manager-Worker DAG</p>
          </div>
          <button
            type="button"
            onClick={loadWorkflowData}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Trigger Demo DAG */}
        <button
          type="button"
          className="mobile-btn-touch mobile-btn-primary"
          onClick={handleRunDemo}
          disabled={runningDemo}
        >
          <Play size={14} className={runningDemo ? 'animate-spin' : ''} />
          {runningDemo ? 'Executing 8-Agent DAG...' : 'Run Rajmahal Discrepancy DAG'}
        </button>

        {activeWf && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-2)',
              borderRadius: 6,
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => onInspectWorkflow && onInspectWorkflow(activeWf.id)}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Latest DAG Job:</div>
              <div className="text-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeWf.id}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                }}
              >
                {activeWf.status}
              </span>
              <Eye size={14} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
        )}
      </div>

      {/* 3. 8 Specialized Agent Cards (Interactive Accordion) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          8 SPECIALIZED DOMAIN AGENTS
        </div>

        {AGENT_STAGES.map((agent) => {
          const isExpanded = expandedAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`mobile-stage-card ${isExpanded ? 'active' : ''}`}
              onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: agent.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {agent.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{agent.role}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: agent.color,
                      border: `1px solid ${agent.color}33`,
                    }}
                  >
                    {agent.badge}
                  </span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Collapsed Brief Summary */}
              {!isExpanded && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                  {agent.description.slice(0, 90)}...
                </p>
              )}

              {/* Expanded In-Depth Details */}
              {isExpanded && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-hairline)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {agent.description}
                  </p>

                  {/* Standard / Invariant */}
                  <div
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      borderRadius: 6,
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: 11,
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}
                  >
                    ⚡ {agent.telemetryMetric}
                  </div>

                  {/* Inputs */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>
                      INPUTS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {agent.inputs.map((inp, idx) => (
                        <div key={idx} style={{ fontSize: 11, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: 'var(--accent-teal)' }}>•</span> {inp}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>
                      OUTPUTS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {agent.outputs.map((out, idx) => (
                        <div key={idx} style={{ fontSize: 11, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#10B981' }}>✓</span> {out}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
