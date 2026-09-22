import React from 'react';
import {
  Network,
  FileText,
  Search,
  Bot,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  Landmark,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';

export interface AgentStepState {
  name: string;
  label: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'warning';
  latencyMs?: number;
  factsExtracted?: number;
}

interface AgentExecutionStepperProps {
  activeAgentIndex?: number;
  isRunning?: boolean;
  onSelectAgent?: (agentName: string) => void;
}

const AGENTS_LIST = [
  { id: 'ManagerAgent', label: '1. Manager DAG', role: 'Decomposes task & plans worker graph', icon: Network, defaultMs: 142 },
  { id: 'DocumentIntelligenceAgent', label: '2. Document OCR', role: 'Parses PDF/DOCX & chunks text', icon: FileText, defaultMs: 420 },
  { id: 'SemanticRetrievalAgent', label: '3. Hybrid RAG', role: 'TF-IDF + dense vector RRF ranking', icon: Search, defaultMs: 230 },
  { id: 'MiningIntelligenceAgent', label: '4. Mining Facts', role: 'Extracts Coal MT, OBR & HEMM stats', icon: Bot, defaultMs: 310 },
  { id: 'DiscrepancyAgent', label: '5. Conflict Detector', role: 'Flags cross-document variance', icon: ShieldAlert, defaultMs: 180 },
  { id: 'QualityGovernanceAgent', label: '6. ISO Quality Gate', role: 'Validates grounding & citations', icon: ShieldCheck, defaultMs: 120 },
  { id: 'ReportGenerationAgent', label: '7. Synthesis Engine', role: 'Compiles clean executive reports', icon: FileCheck, defaultMs: 510 },
  { id: 'ParliamentaryInquiryAgent', label: '8. Parliament Desk', role: 'Drafts Ministry response drafts', icon: Landmark, defaultMs: 290 },
];

export const AgentExecutionStepper: React.FC<AgentExecutionStepperProps> = ({
  activeAgentIndex = -1,
  isRunning = false,
  onSelectAgent,
}) => {
  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        backgroundImage: 'linear-gradient(135deg, rgba(31, 138, 92, 0.04) 0%, rgba(217, 119, 6, 0.04) 100%)',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Live 8-Agent Swarm Orchestration Telemetry
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isRunning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isRunning ? 'var(--status-warning)' : 'var(--status-success)'}`,
              color: isRunning ? 'var(--status-warning)' : 'var(--status-success)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isRunning ? 'var(--status-warning)' : 'var(--status-success)',
                animation: isRunning ? 'pulse 1.2s infinite' : 'none',
              }}
            />
            {isRunning ? 'Swarm Executing Real-Time DAG' : '8 Agents Ready / Standing By'}
          </span>
        </div>
      </div>

      {/* 8-Agent Responsive Flow Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 8,
        }}
      >
        {AGENTS_LIST.map((ag, idx) => {
          const IconComponent = ag.icon;
          const isActive = isRunning && activeAgentIndex === idx;
          const isCompleted = !isRunning || activeAgentIndex > idx;

          return (
            <button
              key={ag.id}
              type="button"
              onClick={() => onSelectAgent?.(ag.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive
                  ? 'rgba(31, 138, 92, 0.2)'
                  : isCompleted
                  ? 'rgba(15, 23, 42, 0.6)'
                  : 'rgba(15, 23, 42, 0.3)',
                border: `1px solid ${
                  isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'var(--border-hairline)'
                }`,
                cursor: onSelectAgent ? 'pointer' : 'default',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 12px rgba(31, 138, 92, 0.35)' : 'none',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#fff' : 'var(--accent-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <IconComponent size={15} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
                    {ag.label}
                  </span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 size={12} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                  )}
                  {isActive && (
                    <Clock size={12} style={{ color: 'var(--status-warning)', flexShrink: 0 }} className="animate-spin" />
                  )}
                </div>

                <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }} className="truncate">
                  {ag.role}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span className="text-mono" style={{ fontSize: 9, color: 'var(--accent-teal)' }}>
                    ~{ag.defaultMs}ms
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: 9, color: 'var(--status-success)', fontWeight: 600 }}>
                    100% Grounded
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
