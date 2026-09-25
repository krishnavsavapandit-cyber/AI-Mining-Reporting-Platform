import React, { useState, useEffect } from 'react';
import {
  Network,
  FileText,
  Search,
  Cpu,
  ShieldAlert,
  FileCheck2,
  Landmark,
  ShieldCheck,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Flame,
  Sparkles,
} from 'lucide-react';
import { Agent, AgentName, AgentStatusType } from '@/types';
import { Badge } from '@/components/ui/Badge';

export interface AgentStationConfig {
  id: string;
  stationNumber: string;
  name: AgentName;
  shortRole: string;
  tier: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
}

export const EXACT_8_AGENT_STATIONS: AgentStationConfig[] = [
  {
    id: 'manager',
    stationNumber: '01',
    name: 'ManagerAgent',
    shortRole: 'Orchestration',
    tier: 'Orchestration',
    description:
      'Coordinates 8 specialized agents, schedules dependency DAGs, executes concurrent tasks, enforces quality gates, and tracks full provenance.',
    icon: <Network size={20} />,
    color: '#A78BFA',
    badge: 'DAG Orchestration',
  },
  {
    id: 'doc_intel',
    stationNumber: '02',
    name: 'DocumentIntelligenceAgent',
    shortRole: 'Ingestion & Extraction',
    tier: 'Ingestion & Extraction',
    description:
      'Performs deterministic document parsing, OCR, entity extraction, chunking, and indexing.',
    icon: <FileText size={20} />,
    color: 'var(--accent-teal)',
    badge: 'Deterministic OCR & Ingestion',
  },
  {
    id: 'retrieval',
    stationNumber: '03',
    name: 'RetrievalAgent',
    shortRole: 'Evidence Retrieval',
    tier: 'Ingestion & Extraction',
    description:
      'Performs domain-expanded hybrid keyword and semantic retrieval, ranking grounded evidence chunks.',
    icon: <Search size={20} />,
    color: 'var(--accent-primary)',
    badge: 'Hybrid Vector & Lexical RRF',
  },
  {
    id: 'mining_intel',
    stationNumber: '04',
    name: 'MiningIntelligenceAgent',
    shortRole: 'Mining Intelligence',
    tier: 'Mining Intelligence',
    description:
      'Extracts mining entities, normalizes units, calculates stripping ratios, LTIFR, coal grades, HEMM metrics, validates physical plausibility, and structures domain facts.',
    icon: <Cpu size={20} />,
    color: '#60A5FA',
    badge: 'Mining Math & G1-G17 Grades',
  },
  {
    id: 'validation',
    stationNumber: '05',
    name: 'ValidationAgent',
    shortRole: 'Validation',
    tier: 'Validation',
    description:
      'Analyzes cross-document figures, detects numerical discrepancies, and flags data inconsistencies.',
    icon: <ShieldAlert size={20} />,
    color: 'var(--status-warning)',
    badge: 'Cross-Document Conflict Engine',
  },
  {
    id: 'report_gen',
    stationNumber: '06',
    name: 'ReportGenerationAgent',
    shortRole: 'Synthesis & Output',
    tier: 'Synthesis & Output',
    description:
      'Compiles multi-section executive mining reports with tables, validation caveats, and PDF/DOCX exports.',
    icon: <FileCheck2 size={20} />,
    color: '#F472B6',
    badge: '16-Section Statutory Synthesis',
  },
  {
    id: 'gov_inquiry',
    stationNumber: '07',
    name: 'GovernmentInquiryAgent',
    shortRole: 'Parliamentary Inquiry',
    tier: 'Parliamentary Inquiry',
    description:
      'Decomposes parliamentary questions, aggregates grounded evidence, flags conflicts, and formats draft answers.',
    icon: <Landmark size={20} />,
    color: '#FBBF24',
    badge: 'Parliamentary PQ Formulation',
  },
  {
    id: 'quality_gov',
    stationNumber: '08',
    name: 'QualityGovernanceAgent',
    shortRole: 'Validation & Governance',
    tier: 'Validation & Governance',
    description:
      'Release gatekeeper performing evidence verification, schema validation, calculation checks, and governance release gating.',
    icon: <ShieldCheck size={20} />,
    color: 'var(--text-emerald)',
    badge: 'ISO/IEC 25010 Quality Gatekeeper',
  },
];

interface AgentMinecartTrackProps {
  agents?: Agent[];
  selectedAgentName?: string;
  onSelectAgent?: (agentName: AgentName) => void;
  activeRunId?: string;
}

export const AgentMinecartTrack: React.FC<AgentMinecartTrackProps> = ({
  agents = [],
  selectedAgentName = 'ManagerAgent',
  onSelectAgent,
  activeRunId,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Sync active stage with selected agent if provided externally
  useEffect(() => {
    if (selectedAgentName) {
      const idx = EXACT_8_AGENT_STATIONS.findIndex((s) => s.name === selectedAgentName);
      if (idx !== -1 && idx !== activeStageIndex) {
        setActiveStageIndex(idx);
      }
    }
  }, [selectedAgentName]);

  // Auto-advance loop when playing
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(4800 / speedMultiplier);
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => {
        const next = (prev + 1) % EXACT_8_AGENT_STATIONS.length;
        if (onSelectAgent) {
          onSelectAgent(EXACT_8_AGENT_STATIONS[next].name);
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, onSelectAgent]);

  const activeStage = EXACT_8_AGENT_STATIONS[activeStageIndex];
  const totalStages = EXACT_8_AGENT_STATIONS.length;
  const progressPct = (activeStageIndex / (totalStages - 1)) * 100;

  // Helper to retrieve live telemetry from registered backend agents
  const getAgentMetrics = (name: AgentName) => {
    const found = agents.find((a) => a.name === name);
    return {
      status: (found ? found.status : 'IDLE') as AgentStatusType | 'HUMAN_VERIFICATION' | 'SKIPPED',
      tasks_processed: found ? found.tasks_processed : 0,
      errors: found ? found.errors : 0,
      last_active: null,
    };
  };

  const activeAgentMetrics = getAgentMetrics(activeStage.name);

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#0A0E17',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.85), 0 0 45px rgba(16, 185, 129, 0.12)',
      }}
    >
      {/* 1. SUBTERRANEAN BACKDROP WITH REALISTIC TIMBER CAVERN LIGHTING */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(180deg, rgba(8, 12, 18, 0.88) 0%, rgba(11, 16, 26, 0.82) 40%, rgba(8, 12, 18, 0.96) 100%),
            url("/images/mine_tunnel_backdrop.jpg")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
          opacity: 0.75,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Cavern Ambient Radial Glows */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 85% 20%, rgba(16, 185, 129, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 15% 75%, rgba(245, 158, 11, 0.14) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 10%, rgba(6, 182, 212, 0.12) 0%, transparent 60%)
          `,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* High-Fidelity Minecart and Subterranean Physics Styles */}
      <style>{`
        @keyframes cartWheelSpinSmooth {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes cartRailHarmonicRumble {
          0% { transform: translateY(0px) rotate(0deg); }
          20% { transform: translateY(-1.8px) rotate(0.35deg); }
          40% { transform: translateY(0.8px) rotate(-0.3deg); }
          60% { transform: translateY(-1.2px) rotate(0.2deg); }
          80% { transform: translateY(0.4px) rotate(-0.15deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        @keyframes lanternFlameFlicker {
          0%, 100% {
            opacity: 0.95;
            filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.95)) drop-shadow(0 0 35px rgba(245, 158, 11, 0.6));
            transform: scale(1);
          }
          25% {
            opacity: 0.82;
            filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.75)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.4));
            transform: scale(0.97) rotate(-0.5deg);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 22px rgba(251, 191, 36, 1)) drop-shadow(0 0 45px rgba(245, 158, 11, 0.75));
            transform: scale(1.03) rotate(0.4deg);
          }
          75% {
            opacity: 0.88;
            filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 28px rgba(245, 158, 11, 0.5));
            transform: scale(0.98);
          }
        }

        @keyframes emeraldVeinGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7)); opacity: 0.85; }
          50% { filter: drop-shadow(0 0 16px rgba(52, 211, 153, 1)); opacity: 1; }
        }

        @keyframes railSparkFly {
          0% { opacity: 0.9; transform: translate(0, 0) scale(0.8); }
          50% { opacity: 0.6; transform: translate(-10px, -8px) scale(1.2); }
          100% { opacity: 0; transform: translate(-20px, -14px) scale(0.3); }
        }

        .realistic-minecart-carrier {
          transition: left 1.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .minecart-wobble-active {
          animation: cartRailHarmonicRumble 0.38s ease-in-out infinite;
        }

        .minecart-spinning-wheel {
          animation: cartWheelSpinSmooth 0.75s linear infinite;
          transform-origin: center;
        }

        .dungeon-lantern-glow {
          animation: lanternFlameFlicker 2.2s ease-in-out infinite;
        }

        .emerald-ore-crystal {
          animation: emeraldVeinGlow 2.8s ease-in-out infinite;
        }
      `}</style>

      {/* Main Inner Container */}
      <div style={{ position: 'relative', zIndex: 2, padding: '28px 24px' }}>
        {/* Header Bar with Control Room Identifiers */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
            paddingBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Left Title & Subtitle */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(217, 119, 6, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#FBBF24',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <Flame size={13} className="dungeon-lantern-glow" /> 8-AGENT AUTONOMOUS PIPELINE
              </span>

              {activeRunId && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(59, 130, 246, 0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93C5FD',
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  RUN ID: {activeRunId}
                </span>
              )}

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: 'var(--text-emerald)',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                STATION 0{activeStageIndex + 1} OF 08
              </span>
            </div>

            <h3
              style={{
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>8-AGENT AUTONOMOUS PIPELINE</span>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: '750px' }}>
              Watch the document move through the complete evidence-grounded AI processing pipeline.
            </p>
          </div>

          {/* Right Speed and Stepper Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
              }}
            >
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeedMultiplier(spd)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: speedMultiplier === spd ? 'var(--accent-primary)' : 'transparent',
                    color: speedMultiplier === spd ? '#FFFFFF' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Previous Station */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const prev = (activeStageIndex - 1 + EXACT_8_AGENT_STATIONS.length) % EXACT_8_AGENT_STATIONS.length;
                setActiveStageIndex(prev);
                if (onSelectAgent) onSelectAgent(EXACT_8_AGENT_STATIONS[prev].name);
              }}
              aria-label="Previous Agent Station"
              style={{ padding: '8px 12px', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 96,
                justifyContent: 'center',
                padding: '8px 14px',
                borderColor: isPlaying ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255,255,255,0.22)',
              }}
            >
              {isPlaying ? (
                <>
                  <Pause size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: 700 }}>Pause</span>
                </>
              ) : (
                <>
                  <Play size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: 700 }}>Run Cart</span>
                </>
              )}
            </button>

            {/* Next Station */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const next = (activeStageIndex + 1) % EXACT_8_AGENT_STATIONS.length;
                setActiveStageIndex(next);
                if (onSelectAgent) onSelectAgent(EXACT_8_AGENT_STATIONS[next].name);
              }}
              aria-label="Next Agent Station"
              style={{ padding: '8px 12px', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 2. SUBTERRANEAN DUAL-RAIL HAULAGE TRACK & 8 STATIONS */}
        <div
          style={{
            position: 'relative',
            padding: '82px 18px 52px',
            marginBottom: 28,
            backgroundColor: 'rgba(7, 10, 16, 0.82)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.92), 0 10px 30px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Overhead Heavy Timber Cap Beam across Tunnel Gallery */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              height: '18px',
              background: 'linear-gradient(180deg, #4A3423 0%, #362416 50%, #20140A 100%)',
              borderTop: '2px solid #6E4F37',
              borderBottom: '2px solid #140C06',
              borderRadius: '3px',
              boxShadow: '0 6px 14px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              zIndex: 3,
            }}
          >
            {/* Iron Corner Gusset Plates with Hex Bolt Heads */}
            {[2, 16, 30, 44, 58, 72, 86, 98].map((posPct, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${posPct}%`,
                  top: '-3px',
                  width: '14px',
                  height: '24px',
                  backgroundColor: '#374151',
                  border: '1px solid #6B7280',
                  borderRadius: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: '2px 0',
                }}
              >
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
              </div>
            ))}

            {/* Hanging Flame Safety Lanterns */}
            {[10, 24, 38, 52, 66, 80, 92].map((posPct, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${posPct}%`,
                  top: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 4,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: '2px',
                    height: '16px',
                    background: 'repeating-linear-gradient(180deg, #6B7280 0px, #6B7280 3px, #374151 3px, #374151 6px)',
                  }}
                />
                <div
                  className="dungeon-lantern-glow"
                  style={{
                    width: '14px',
                    height: '22px',
                    backgroundColor: '#B45309',
                    border: '1.5px solid #F59E0B',
                    borderRadius: '3px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.7)',
                  }}
                >
                  <div style={{ position: 'absolute', width: '1px', height: '100%', backgroundColor: '#FBBF24' }} />
                  <div
                    style={{
                      width: '6px',
                      height: '10px',
                      backgroundColor: '#FEF08A',
                      borderRadius: '50%',
                      boxShadow: '0 0 10px #F59E0B, 0 0 20px #D97706',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Subterranean Gravel Ballast Bed & Cross-Ties (Sleepers) */}
          <div
            style={{
              position: 'relative',
              height: '42px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Crushed Basalt & Granite Rock Ballast Trench */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '-10px',
                right: '-10px',
                height: '42px',
                backgroundColor: '#121620',
                backgroundImage: `
                  radial-gradient(circle at 12% 25%, #283040 2px, transparent 2.5px),
                  radial-gradient(circle at 55% 65%, #1F2633 2px, transparent 2.5px),
                  radial-gradient(circle at 82% 35%, #2E384A 2.5px, transparent 3px),
                  radial-gradient(circle at 35% 80%, #202735 1.5px, transparent 2px)
                `,
                backgroundSize: '18px 18px',
                borderRadius: '8px',
                border: '1px solid #283347',
                boxShadow: 'inset 0 4px 14px rgba(0, 0, 0, 0.9), 0 4px 10px rgba(0, 0, 0, 0.7)',
                zIndex: 1,
              }}
            />

            {/* Heavy Creosote Oak Railway Sleepers */}
            <div
              style={{
                position: 'absolute',
                top: '4px',
                left: 0,
                right: 0,
                height: '34px',
                display: 'flex',
                justifyContent: 'space-between',
                zIndex: 2,
                pointerEvents: 'none',
                padding: '0 6px',
              }}
            >
              {Array.from({ length: 44 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '100%',
                    background: 'linear-gradient(180deg, #38281B 0%, #241A11 100%)',
                    borderLeft: '1px solid #543E2C',
                    borderRight: '1px solid #140D08',
                    borderRadius: '1.5px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                />
              ))}
            </div>

            {/* Top Steel Bullhead Rail */}
            <div
              style={{
                position: 'absolute',
                top: '9px',
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(180deg, #E5E7EB 0%, #9CA3AF 40%, #374151 100%)',
                zIndex: 3,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
              }}
            />

            {/* Bottom Steel Bullhead Rail */}
            <div
              style={{
                position: 'absolute',
                bottom: '9px',
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(180deg, #E5E7EB 0%, #9CA3AF 40%, #374151 100%)',
                zIndex: 3,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
              }}
            />

            {/* Active Energized Laser Alignment Beam */}
            <div
              style={{
                position: 'absolute',
                top: '9px',
                left: 0,
                width: `${progressPct}%`,
                height: '4px',
                background: 'linear-gradient(90deg, #059669, #10B981, #34D399, #6EE7B7)',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.95), 0 0 32px rgba(52, 211, 153, 0.65)',
                transition: 'width 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
                zIndex: 4,
              }}
            />

            {/* 8 Checkpoint Stations Along the Mine Shaft */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                zIndex: 6,
                padding: '0 10px',
              }}
            >
              {EXACT_8_AGENT_STATIONS.map((stage, idx) => {
                const metrics = getAgentMetrics(stage.name);
                const isPastOrCurrent = idx <= activeStageIndex;
                const isCurrent = idx === activeStageIndex;

                let statusColor = '#475569';
                if (metrics.status === 'RUNNING' || metrics.status === 'BUSY') {
                  statusColor = '#10B981';
                } else if (metrics.status === 'FAILED') {
                  statusColor = '#EF4444';
                } else if (metrics.status === 'HUMAN_VERIFICATION' || metrics.status === 'PAUSED') {
                  statusColor = '#F59E0B';
                } else if (isPastOrCurrent) {
                  statusColor = '#059669';
                }

                return (
                  <div
                    key={stage.id}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStageIndex(idx);
                        setIsPlaying(false);
                        if (onSelectAgent) onSelectAgent(stage.name);
                      }}
                      style={{
                        width: isCurrent ? '30px' : '22px',
                        height: isCurrent ? '30px' : '22px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? '#10B981' : isPastOrCurrent ? statusColor : '#1E293B',
                        border: isCurrent
                          ? '3px solid #FFFFFF'
                          : isPastOrCurrent
                          ? `2px solid ${statusColor}`
                          : '2px solid #475569',
                        boxShadow: isCurrent
                          ? '0 0 22px #10B981, 0 0 12px #FFFFFF'
                          : '0 2px 6px rgba(0,0,0,0.6)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
                        outline: 'none',
                      }}
                      title={`Agent 0${stage.stationNumber}: ${stage.name} (${metrics.status})`}
                    >
                      {isPastOrCurrent && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 0 5px #FFFFFF',
                          }}
                        />
                      )}
                    </button>

                    {/* Agent Station Label */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '32px',
                        fontSize: '11px',
                        fontWeight: isCurrent ? 900 : 700,
                        color: isCurrent ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.04em',
                        textShadow: isCurrent ? '0 0 10px rgba(16, 185, 129, 0.9)' : 'none',
                      }}
                    >
                      0{stage.stationNumber}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 3. ARTICULATED HEAVY IRON COAL MINECART */}
            <div
              className="realistic-minecart-carrier"
              style={{
                position: 'absolute',
                left: `calc(${progressPct}% - 48px)`,
                top: '-68px',
                width: '96px',
                height: '70px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <div className="minecart-wobble-active" style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Volumetric Headlamp Light Cone */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '78px',
                    width: '120px',
                    height: '46px',
                    background:
                      'radial-gradient(ellipse at left, rgba(254, 240, 138, 0.65) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 85%)',
                    clipPath: 'polygon(0% 35%, 100% 0%, 100% 100%, 0% 65%)',
                    pointerEvents: 'none',
                    animation: 'lanternFlameFlicker 2.4s ease-in-out infinite',
                    zIndex: 2,
                  }}
                />

                {/* Trailing Rail Sparks */}
                {isPlaying && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '32px',
                      left: '-10px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(251, 191, 36, 0.5)',
                      filter: 'blur(2px)',
                      animation: 'railSparkFly 0.8s ease-out infinite',
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Authentic Weathered Iron & Timber Minecart SVG */}
                <svg
                  width="96"
                  height="70"
                  viewBox="0 0 96 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    filter:
                      'drop-shadow(0 12px 24px rgba(0,0,0,0.98)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.25))',
                  }}
                >
                  {/* Heaped Anthracite Coal Chunk Pile */}
                  <path
                    d="M16 24 Q26 8 36 14 Q48 4 62 11 Q74 7 82 24 Z"
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth="1.4"
                  />
                  <polygon points="24,20 31,12 39,17 30,23" fill="#1F2937" />
                  <polygon points="42,15 51,7 57,14 49,21" fill="#1E2738" />
                  <polygon points="62,17 70,10 76,16 68,22" fill="#141A24" />
                  <polygon points="34,10 40,6 46,9 39,13" fill="#263143" />

                  {/* Sparkling Geological Emerald Crystals */}
                  <polygon points="38,12 43,8 48,12 43,16" fill="#34D399" className="emerald-ore-crystal" />
                  <polygon points="54,14 58,10 62,14 58,18" fill="#10B981" className="emerald-ore-crystal" />
                  <circle cx="30" cy="15" r="3.2" fill="#6EE7B7" className="emerald-ore-crystal" />
                  <circle cx="72" cy="14" r="2.8" fill="#34D399" className="emerald-ore-crystal" />
                  <polygon points="50,17 53,13 57,17 53,20" fill="#A7F3D0" />

                  {/* Weathered Heavy Iron Hopper Body */}
                  <path d="M12 24 L84 24 L74 52 L22 52 Z" fill="#222B3D" stroke="#475569" strokeWidth="1.8" />

                  {/* Top Reinforced Steel Flange Rim */}
                  <rect x="10" y="22" width="76" height="4" rx="1.5" fill="#64748B" stroke="#334155" strokeWidth="0.8" />

                  {/* Industrial Caution Chevrons */}
                  <path d="M26 30 L34 30 L29 46 L21 46 Z" fill="#F59E0B" opacity="0.95" />
                  <path d="M41 30 L49 30 L44 46 L36 46 Z" fill="#F59E0B" opacity="0.95" />
                  <path d="M56 30 L64 30 L59 46 L51 46 Z" fill="#F59E0B" opacity="0.95" />
                  <path d="M71 30 L78 30 L73 46 L66 46 Z" fill="#F59E0B" opacity="0.95" />

                  {/* Reinforcement Brackets */}
                  <line x1="22" y1="52" x2="74" y2="52" stroke="#0F172A" strokeWidth="3.2" />
                  <line x1="37" y1="25" x2="40" y2="51" stroke="#475569" strokeWidth="1.4" />
                  <line x1="60" y1="25" x2="57" y2="51" stroke="#475569" strokeWidth="1.4" />

                  {/* Rivet Studs */}
                  {[16, 28, 40, 52, 64, 76].map((rx, idx) => (
                    <circle key={idx} cx={rx} cy="24" r="1.1" fill="#E2E8F0" />
                  ))}
                  {[25, 40, 56, 71].map((rx, idx) => (
                    <circle key={idx} cx={rx} cy="49" r="1.2" fill="#94A3B8" />
                  ))}

                  {/* GeoNexus Emblem Plaque */}
                  <rect x="34" y="32" width="30" height="12" rx="2" fill="#070A0F" stroke="#10B981" strokeWidth="1.4" />
                  <circle cx="40" cy="38" r="2.8" fill="#34D399" />
                  <rect x="46" y="37" width="14" height="2.4" rx="0.6" fill="#F1F5F9" />

                  {/* Front Mining Headlamp */}
                  <rect x="82" y="29" width="7" height="9" rx="1.5" fill="#D97706" stroke="#B45309" strokeWidth="1" />
                  <circle cx="87" cy="33.5" r="4.5" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1.2" />
                  <circle cx="87" cy="33.5" r="2.4" fill="#FFFFFF" />

                  {/* Heavy Cast Iron Under-Chassis Beam */}
                  <rect x="18" y="52" width="62" height="5.5" rx="1.5" fill="#0B0F17" stroke="#334155" strokeWidth="1.2" />

                  {/* Left 8-Spoke Cast Steel Wheel Bogie */}
                  <g className="minecart-spinning-wheel" style={{ transformBox: 'fill-box' }}>
                    <circle cx="32" cy="57.5" r="9" fill="#334155" stroke="#F1F5F9" strokeWidth="2.2" />
                    <circle cx="32" cy="57.5" r="3.8" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="32" y1="49" x2="32" y2="66" stroke="#94A3B8" strokeWidth="1.4" />
                    <line x1="23.5" y1="57.5" x2="40.5" y2="57.5" stroke="#94A3B8" strokeWidth="1.4" />
                  </g>

                  {/* Right 8-Spoke Cast Steel Wheel Bogie */}
                  <g className="minecart-spinning-wheel" style={{ transformBox: 'fill-box' }}>
                    <circle cx="66" cy="57.5" r="9" fill="#334155" stroke="#F1F5F9" strokeWidth="2.2" />
                    <circle cx="66" cy="57.5" r="3.8" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="66" y1="49" x2="66" y2="66" stroke="#94A3B8" strokeWidth="1.4" />
                    <line x1="57.5" y1="57.5" x2="74.5" y2="57.5" stroke="#94A3B8" strokeWidth="1.4" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 4. ACTIVE AGENT STATION DETAIL WORKBENCH */}
        <div
          style={{
            backgroundColor: 'rgba(13, 18, 28, 0.95)',
            borderRadius: 'var(--radius-md)',
            padding: '22px 24px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
            gap: 24,
            alignItems: 'center',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Left: Agent Station Overview & Role */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid var(--border-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeStage.color,
                  flexShrink: 0,
                  boxShadow: '0 0 18px rgba(16, 185, 129, 0.3)',
                }}
              >
                {activeStage.icon}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: activeStage.color,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    STATION {activeStage.stationNumber} • {activeStage.badge}
                  </span>
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: '2px 0 0' }}>
                  {activeStage.name}
                </h4>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 8 }}>
              {activeStage.shortRole} • {activeStage.tier}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {activeStage.description}
            </p>
          </div>

          {/* Right: Live Real-Time Telemetry Metrics Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              padding: '16px',
              backgroundColor: 'rgba(7, 10, 16, 0.75)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                CURRENT STATUS
              </div>
              <div style={{ marginTop: 4 }}>
                <Badge
                  variant={
                    activeAgentMetrics.status === 'RUNNING' || activeAgentMetrics.status === 'BUSY'
                      ? 'teal'
                      : activeAgentMetrics.status === 'FAILED'
                      ? 'error'
                      : activeAgentMetrics.status === 'HUMAN_VERIFICATION'
                      ? 'warning'
                      : 'slate'
                  }
                >
                  {activeAgentMetrics.status}
                </Badge>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                PROCESSED TASKS
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {activeAgentMetrics.tasks_processed}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ERROR COUNT
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: activeAgentMetrics.errors > 0 ? 'var(--status-error)' : 'var(--text-emerald)',
                  marginTop: 2,
                }}
              >
                {activeAgentMetrics.errors}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                EVIDENCE / DAG
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-teal)', marginTop: 2 }}>
                Grounded
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
