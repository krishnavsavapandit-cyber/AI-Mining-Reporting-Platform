import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  TrendingUp,
  Scale,
  Cpu,
  ShieldCheck,
  FileCheck2,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Activity,
  Flame,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface PipelineStage {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  color: string;
  details: string[];
  image?: string;
  imageCaption?: string;
  machineryTag?: string;
  agentName: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'ingestion',
    number: '01',
    title: 'Multi-Format Ingestion & Geological OCR',
    subtitle: 'Physical Borehole Logs & Stratigraphy Ingestion',
    description:
      'Ingests physical scanned PDFs, CMPDI core drill logs, DOCX, XLSX, and CSV records with automatic PyMuPDF extraction, adaptive Tesseract OCR for geological borehole maps, and SHA-256 cryptographic provenance.',
    icon: <FileText size={20} />,
    badge: 'PyMuPDF + Adaptive OCR',
    color: 'var(--accent-teal)',
    details: [
      'Scanned borehole drill logs & core stratigraphy',
      'SHA-256 cryptographic file provenance',
      'Tabular matrix extraction & OCR cleanup',
    ],
    image: '/images/geological_core_drilling.jpg',
    imageCaption: 'CMPDI Geological Core Sample Trays & Borehole Lithology Analysis',
    machineryTag: 'Core Drilling & Lithology Lab',
    agentName: 'DocumentIntelligenceAgent',
  },
  {
    id: 'retrieval',
    number: '02',
    title: 'Hybrid Evidence Retrieval & Search',
    subtitle: 'Hybrid Reciprocal Rank Fusion Search Engine',
    description:
      'Combines lexical TF-IDF matching and full-text retrieval fused via Reciprocal Rank Fusion (RRF) with exact page and coordinate citations across Coal India commands.',
    icon: <Search size={20} />,
    badge: 'Lexical + Vector RRF',
    color: 'var(--accent-primary)',
    details: [
      'Reciprocal Rank Fusion (RRF) rank merge',
      'Page & bounding-box strata citations',
      'Sub-second multi-document recall',
    ],
    image: '/images/blast_drill_rig.jpg',
    imageCaption: 'High-Precision Rotary Blast Hole Drilling Rig on Opencast Coal Bench',
    machineryTag: 'Rotary Blast-Hole Drill Rig',
    agentName: 'RetrievalAgent',
  },
  {
    id: 'mining-math',
    number: '03',
    title: 'Mining Intelligence & Stripping Ratios',
    subtitle: 'Domain Math & Indian Coal GCV Grading (G1–G17)',
    description:
      'Standardizes mining entities and units (MT, Lakh Te, MCuM), calculates Stripping Ratios across opencast benches, and categorizes coal reserves across standard Indian G1 to G17 GCV grades.',
    icon: <TrendingUp size={20} />,
    badge: 'GCV G1–G17 + OBR Math',
    color: '#60A5FA',
    details: [
      'Coal GCV classification (G1-G17 banding)',
      'Stripping Ratio calculation (OBR / Coal)',
      'Unit normalization (MT, Lakh Te, MCuM)',
    ],
    image: '/images/open_surface_mine.jpg',
    imageCaption: 'CIL Opencast Coal Pit Operations, Dragline Excavators & Tiered Benches',
    machineryTag: 'Opencast Excavation Pits',
    agentName: 'MiningIntelligenceAgent',
  },
  {
    id: 'validation',
    number: '04',
    title: 'Cross-Document Validation & Fleet Audit',
    subtitle: 'Mathematical Discrepancy & Conflict Engine',
    description:
      'Detects mathematical variances between Monthly Operating Reviews, Annual Summaries, and target schedules, flagging conflicting numbers with automated severity scoring.',
    icon: <Scale size={20} />,
    badge: 'Automated Variance Audit',
    color: 'var(--status-warning)',
    details: [
      'Cross-document variance % calculations',
      'Target vs Actual operational discrepancy gate',
      'Conflict audit trail & resolution queue',
    ],
    image: '/images/haul_truck.jpg',
    imageCaption: '240-Tonne Heavy Earth Moving Mega Dump Truck Transporting Raw Coal',
    machineryTag: '240T Heavy Haul Truck Fleet',
    agentName: 'ValidationAgent',
  },
  {
    id: 'orchestration',
    number: '05',
    title: '8-Agent Autonomous Orchestration DAG',
    subtitle: 'Deterministic Manager-Worker Workflow Graph',
    description:
      'A deterministic Manager-Worker Directed Acyclic Graph coordinates parallel tasks across 8 specialized domain agents with bounded retries, task isolation, and execution audit logging.',
    icon: <Cpu size={20} />,
    badge: '8-Agent Parallel DAG',
    color: '#A78BFA',
    details: [
      'Dynamic DAG planning & dependency resolution',
      'Parallel task execution across worker agents',
      'Step-by-step task execution provenance',
    ],
    image: '/images/dragline_excavator.jpg',
    imageCaption: 'SECL Heavy Electric Walking Dragline Excavator Stripping Overburden',
    machineryTag: 'Walking Dragline Excavator',
    agentName: 'ManagerAgent',
  },
  {
    id: 'governance',
    number: '06',
    title: 'Quality & Governance Release Gates',
    subtitle: 'Evidence-Grounded Gatekeeper & Sign-off',
    description:
      'QualityGovernanceAgent independently inspects all generated outputs, verifying evidence sufficiency and citation grounding before issuing PASS, WARNING, REQUIRES_HUMAN_REVIEW, or REJECT release verdicts.',
    icon: <ShieldCheck size={20} />,
    badge: 'Release Verdicts (PASS/REJECT)',
    color: 'var(--text-emerald)',
    details: [
      'Deterministic 4-state release verification',
      'Evidence-grounded response gating',
      'Cryptographic review sign-off record',
    ],
    image: '/images/continuous_miner.jpg',
    imageCaption: 'Underground Subterranean Continuous Miner Cutting Coal Seam in Timbered Tunnel',
    machineryTag: 'Subterranean Continuous Miner',
    agentName: 'QualityGovernanceAgent',
  },
  {
    id: 'reporting',
    number: '07',
    title: 'Statutory Reports & Ministry Inquiries',
    subtitle: 'Official Synthesis, DGMS Compliance & Dispatch',
    description:
      'Generates executive summaries, DGMS statutory compliance drafts with mandatory draft watermarks, and evidence-grounded parliamentary inquiry responses ready for Joint Secretary review.',
    icon: <FileCheck2 size={20} />,
    badge: 'DGMS & Parliamentary',
    color: '#F472B6',
    details: [
      'DGMS statutory safety compliance reports',
      'Ministry & Lok Sabha/Rajya Sabha drafts',
      'Mandatory draft verification watermarks',
    ],
    image: '/images/coal_handling_plant.jpg',
    imageCaption: 'Coal Handling Plant (CHP) Rapid Silo Loading & Rail Freight Dispatch',
    machineryTag: 'Rail Dispatch & Silo Terminals',
    agentName: 'ReportGenerationAgent & GovernmentInquiryAgent',
  },
];

export const MiningCartTrack: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; caption: string } | null>(null);

  // Auto-advance loop with variable speed
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(4600 / speedMultiplier);
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier]);

  const activeStage = PIPELINE_STAGES[activeStageIndex];
  const totalStages = PIPELINE_STAGES.length;
  const progressPct = (activeStageIndex / (totalStages - 1)) * 100;

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
      {/* 1. PHOTOREALISTIC SUBTERRANEAN DUNGEON / UNDERGROUND COAL MINE BACKDROP */}
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

      {/* Atmospheric Cavern Veins & Ambient Lighting Auras */}
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

      {/* Embedded High-Fidelity Physics & Atmospheric Keyframes */}
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

      {/* Main Container Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '32px 28px' }}>
        {/* 2. Top Header Bar with Controls & Test Matchers */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 28,
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Left: Heading & Badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
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
                <Flame size={13} className="dungeon-lantern-glow" /> SUBTERRANEAN MINE DRIFT CONVEYOR
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: 'var(--text-emerald)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <Activity size={12} /> Autonomous Intelligence Conveyor
              </span>

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
                STAGE 0{activeStageIndex + 1} OF 07
              </span>
            </div>

            <h3
              style={{
                fontSize: 'clamp(22px, 2.6vw, 28px)',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>The GeoNexus Geological Intelligence Pipeline</span>
              <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0', maxWidth: '780px' }}>
              Follow physical stratigraphy and borehole records as they journey through heavy underground timbered galleries, orchestrated by 8 autonomous domain agents to verified DGMS synthesis.
            </p>
          </div>

          {/* Right: Interactive Playback & Speed Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Speed Pills */}
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

            {/* Prev Stage */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setActiveStageIndex((prev) => (prev - 1 + PIPELINE_STAGES.length) % PIPELINE_STAGES.length)
              }
              aria-label="Previous Stage"
              style={{ padding: '8px 12px', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Play/Pause */}
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

            {/* Next Stage */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveStageIndex((prev) => (prev + 1) % PIPELINE_STAGES.length)}
              aria-label="Next Stage"
              style={{ padding: '8px 12px', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 3. SUBTERRANEAN TIMBER SUPPORT GALLERY & DUAL-RAIL HAULAGE SYSTEM */}
        <div
          style={{
            position: 'relative',
            padding: '82px 18px 52px',
            marginBottom: 32,
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
            {[2, 28, 54, 80, 98].map((posPct, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${posPct}%`,
                  top: '-3px',
                  width: '16px',
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
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
              </div>
            ))}

            {/* Hanging Flame Safety Lanterns with Brass Cages */}
            {[12, 38, 64, 88].map((posPct, idx) => (
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
                {/* Forged Iron Chain */}
                <div
                  style={{
                    width: '2px',
                    height: '16px',
                    background: 'repeating-linear-gradient(180deg, #6B7280 0px, #6B7280 3px, #374151 3px, #374151 6px)',
                  }}
                />
                {/* Brass Safety Lantern Body */}
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
                  {/* Brass Cage Bars */}
                  <div style={{ position: 'absolute', width: '1px', height: '100%', backgroundColor: '#FBBF24' }} />
                  {/* Glowing Flame Core */}
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

          {/* Overhead Spiral Flexible Ventilation Duct */}
          <div
            style={{
              position: 'absolute',
              top: '36px',
              left: '20px',
              right: '20px',
              height: '8px',
              background: 'repeating-linear-gradient(90deg, #D97706 0px, #D97706 8px, #78350F 8px, #78350F 12px)',
              borderRadius: '4px',
              opacity: 0.8,
              zIndex: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
          />

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
              {Array.from({ length: 38 }).map((_, i) => (
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

            {/* Top Heavy-Duty Steel Bullhead Rail */}
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

            {/* Bottom Heavy-Duty Steel Bullhead Rail */}
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

            {/* Active Energized Laser Alignment Conveyor Beam */}
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

            {/* Checkpoint Stations along the Shaft */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                zIndex: 6,
              }}
            >
              {PIPELINE_STAGES.map((stage, idx) => {
                const isPastOrCurrent = idx <= activeStageIndex;
                const isCurrent = idx === activeStageIndex;

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
                      }}
                      style={{
                        width: isCurrent ? '28px' : '20px',
                        height: isCurrent ? '28px' : '20px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent
                          ? '#10B981'
                          : isPastOrCurrent
                          ? '#059669'
                          : '#1E293B',
                        border: isCurrent
                          ? '3px solid #FFFFFF'
                          : isPastOrCurrent
                          ? '2px solid #34D399'
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
                      title={`Stage ${stage.number}: ${stage.title}`}
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

                    {/* Station Code Label */}
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
                      ST-{stage.number}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 4. THE AUTHENTIC ARTICULATED HEAVY IRON COAL MINECART */}
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
                {/* Volumetric Headlamp Light Cone piercing tunnel mist */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '78px',
                    width: '120px',
                    height: '46px',
                    background: 'radial-gradient(ellipse at left, rgba(254, 240, 138, 0.65) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 85%)',
                    clipPath: 'polygon(0% 35%, 100% 0%, 100% 100%, 0% 65%)',
                    pointerEvents: 'none',
                    animation: 'lanternFlameFlicker 2.4s ease-in-out infinite',
                    zIndex: 2,
                  }}
                />

                {/* Trailing Rail Sparks and Coal Dust */}
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

                {/* Ultra-Detailed Weathered Iron & Timber Minecart SVG */}
                <svg
                  width="96"
                  height="70"
                  viewBox="0 0 96 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.98)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.25))',
                  }}
                >
                  {/* Heaped Anthracite Coal Chunk Pile */}
                  <path
                    d="M16 24 Q26 8 36 14 Q48 4 62 11 Q74 7 82 24 Z"
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth="1.4"
                  />
                  {/* Multi-Faceted High-Rank Coal Lumps */}
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
                  <path
                    d="M12 24 L84 24 L74 52 L22 52 Z"
                    fill="#222B3D"
                    stroke="#475569"
                    strokeWidth="1.8"
                  />

                  {/* Top Reinforced Steel Flange Rim */}
                  <rect x="10" y="22" width="76" height="4" rx="1.5" fill="#64748B" stroke="#334155" strokeWidth="0.8" />

                  {/* Industrial Caution Hazard Chevrons */}
                  <path d="M26 30 L34 30 L29 46 L21 46 Z" fill="#F59E0B" opacity="0.95" />
                  <path d="M41 30 L49 30 L44 46 L36 46 Z" fill="#F59E0B" opacity="0.95" />
                  <path d="M56 30 L64 30 L59 46 L51 46 Z" fill="#F59E0B" opacity="0.95" />
                  <path d="M71 30 L78 30 L73 46 L66 46 Z" fill="#F59E0B" opacity="0.95" />

                  {/* Vertical Reinforcement Brackets & Rivets */}
                  <line x1="22" y1="52" x2="74" y2="52" stroke="#0F172A" strokeWidth="3.2" />
                  <line x1="37" y1="25" x2="40" y2="51" stroke="#475569" strokeWidth="1.4" />
                  <line x1="60" y1="25" x2="57" y2="51" stroke="#475569" strokeWidth="1.4" />

                  {/* Steel Rivet Studs */}
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

                  {/* Front High-Lumen Mining Headlamp */}
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
                    <line x1="26" y1="51.5" x2="38" y2="63.5" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="26" y1="63.5" x2="38" y2="51.5" stroke="#94A3B8" strokeWidth="1.2" />
                  </g>

                  {/* Right 8-Spoke Cast Steel Wheel Bogie */}
                  <g className="minecart-spinning-wheel" style={{ transformBox: 'fill-box' }}>
                    <circle cx="66" cy="57.5" r="9" fill="#334155" stroke="#F1F5F9" strokeWidth="2.2" />
                    <circle cx="66" cy="57.5" r="3.8" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="66" y1="49" x2="66" y2="66" stroke="#94A3B8" strokeWidth="1.4" />
                    <line x1="57.5" y1="57.5" x2="74.5" y2="57.5" stroke="#94A3B8" strokeWidth="1.4" />
                    <line x1="60" y1="51.5" x2="72" y2="63.5" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="60" y1="63.5" x2="72" y2="51.5" stroke="#94A3B8" strokeWidth="1.2" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ACTIVE STAGE DEEP DIVE CARD WITH PHOTOREALISTIC MINING PREVIEWS */}
        <div
          style={{
            backgroundColor: 'rgba(13, 18, 28, 0.95)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 24,
            alignItems: 'center',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Left Column: Stage Metadata, Description & Specs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
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
                    STAGE {activeStage.number} • {activeStage.badge}
                  </span>
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: '2px 0 0' }}>
                  {activeStage.title}
                </h4>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 8 }}>
              {activeStage.subtitle} • Assigned: {activeStage.agentName}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 14px' }}>
              {activeStage.description}
            </p>

            {/* Feature Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {activeStage.details.map((detail, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#E2E8F0',
                  }}
                >
                  <Zap size={13} style={{ color: activeStage.color, flexShrink: 0 }} />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: High-Resolution HEMM & Laboratory Image */}
          {activeStage.image && (
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                backgroundColor: '#000000',
                height: '210px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
              }}
              onClick={() =>
                setLightboxImage({
                  url: activeStage.image!,
                  title: activeStage.machineryTag || activeStage.title,
                  caption: activeStage.imageCaption || activeStage.description,
                })
              }
            >
              <img
                src={activeStage.image}
                alt={activeStage.machineryTag || activeStage.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              />

              {/* Machinery Tag Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {activeStage.machineryTag}
              </div>

              {/* Expand Overlay Button */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Maximize2 size={11} /> Expand
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. PHOTO LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '900px',
              width: '100%',
              backgroundColor: '#0D121C',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#131A26',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Image */}
            <div style={{ maxHeight: '60vh', overflow: 'hidden', backgroundColor: '#000000' }}>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>

            {/* Caption */}
            <div style={{ padding: '16px 20px', fontSize: 13, color: '#CBD5E1', backgroundColor: '#0A0E17' }}>
              {lightboxImage.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiningCartTrack;
