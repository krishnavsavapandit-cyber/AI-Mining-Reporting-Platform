import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { PIPELINE_STAGES, PipelineStage } from '@/components/landing/MiningCartTrack';

interface MobileMineCartProps {
  onSelectStageAction?: (stageId: string) => void;
}

export const MobileMineCart: React.FC<MobileMineCartProps> = ({ onSelectStageAction }) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedDetailStage, setSelectedDetailStage] = useState<PipelineStage | null>(null);

  // Auto-advance loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(4500 / speedMultiplier);
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier]);

  const activeStage = PIPELINE_STAGES[activeStageIndex];
  const totalStages = PIPELINE_STAGES.length;
  const progressPct = (activeStageIndex / (totalStages - 1)) * 100;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStageIndex((prev) => (prev > 0 ? prev - 1 : totalStages - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStageIndex((prev) => (prev + 1) % totalStages);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  return (
    <div
      className="mobile-card"
      style={{
        background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(11, 16, 26, 0.98) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Track Glow */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="mobile-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <h3 className="mobile-card-title">Autonomous Mining Pipeline</h3>
          </div>
          <p className="mobile-card-subtitle">
            Stage {activeStage.number} of 07 • {activeStage.agentName}
          </p>
        </div>

        {/* Play / Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={togglePlay}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            type="button"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : 1))}
            style={{
              background: speedMultiplier > 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 6,
              color: speedMultiplier > 1 ? 'var(--accent-primary)' : 'var(--text-secondary)',
              padding: '4px 7px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {speedMultiplier}x
          </button>
        </div>
      </div>

      {/* Mobile Animated Railway Track & Mine Cart Visualizer */}
      <div
        style={{
          position: 'relative',
          padding: '12px 0 6px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* SVG Railway Track */}
        <svg
          viewBox="0 0 320 54"
          style={{ width: '100%', height: '54px', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="mobileTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="cartGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Under-bed ballast line */}
          <line x1="16" y1="36" x2="304" y2="36" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" strokeLinecap="round" />

          {/* Railway Ties / Sleepers */}
          {Array.from({ length: 13 }).map((_, i) => {
            const x = 20 + i * 23.3;
            return (
              <line
                key={i}
                x1={x}
                y1="28"
                x2={x}
                y2="44"
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Dual Steel Rails */}
          <line x1="16" y1="32" x2="304" y2="32" stroke="#4B5563" strokeWidth="2.5" />
          <line x1="16" y1="40" x2="304" y2="40" stroke="#4B5563" strokeWidth="2.5" />

          {/* Active Electrified Top Rail */}
          <line
            x1="16"
            y1="32"
            x2={16 + (progressPct / 100) * 288}
            y2="32"
            stroke="url(#mobileTrackGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Waypoint Stations */}
          {PIPELINE_STAGES.map((stg, idx) => {
            const cx = 20 + (idx / (totalStages - 1)) * 280;
            const isCurrent = idx === activeStageIndex;
            const isPassed = idx < activeStageIndex;

            return (
              <g key={stg.id} onClick={() => setActiveStageIndex(idx)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={cx}
                  cy="36"
                  r={isCurrent ? 7 : 4}
                  fill={isCurrent ? '#10B981' : isPassed ? '#059669' : '#1F2937'}
                  stroke={isCurrent ? '#FFFFFF' : '#374151'}
                  strokeWidth={isCurrent ? 2 : 1}
                />
                {isCurrent && (
                  <circle
                    cx={cx}
                    cy="36"
                    r="11"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}

          {/* Animated Signature Mine Cart */}
          {(() => {
            const cartX = 20 + (progressPct / 100) * 280;
            return (
              <g
                transform={`translate(${cartX - 18}, 8)`}
                style={{
                  transition: isPlaying ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                }}
              >
                {/* Ore Mound in Cart */}
                <path d="M 5,10 Q 18,2 31,10 Z" fill="url(#cartGoldGrad)" />
                {/* Glowing Core Crystal */}
                <circle cx="18" cy="7" r="3" fill="#10B981" filter="drop-shadow(0 0 4px #10B981)" />

                {/* Industrial Cart Tub (Trapezoid) */}
                <polygon
                  points="2,10 34,10 29,22 7,22"
                  fill="#1E293B"
                  stroke="#10B981"
                  strokeWidth="1.5"
                />

                {/* Tub Reinforcement Rivets */}
                <line x1="9" y1="14" x2="27" y2="14" stroke="#334155" strokeWidth="1" />
                <line x1="18" y1="10" x2="18" y2="22" stroke="#10B981" strokeWidth="1" />

                {/* Steel Wheels */}
                <circle cx="9" cy="24" r="3.5" fill="#374151" stroke="#9CA3AF" strokeWidth="1" />
                <circle cx="27" cy="24" r="3.5" fill="#374151" stroke="#9CA3AF" strokeWidth="1" />
                <circle cx="9" cy="24" r="1" fill="#FFFFFF" />
                <circle cx="27" cy="24" r="1" fill="#FFFFFF" />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Active Stage Card Details */}
      <div
        className="mobile-stage-card active"
        onClick={() => {
          setSelectedDetailStage(activeStage);
          onSelectStageAction?.(activeStage.id);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {activeStage.icon}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeStage.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 600 }}>
                {activeStage.badge}
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 10,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}
          >
            ACTIVE
          </span>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
          {activeStage.description}
        </p>

        {/* Machinery Tag & Inspector Prompt */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
          {activeStage.machineryTag && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              ⚙️ {activeStage.machineryTag}
            </span>
          )}

          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            Inspect Details <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* Bottom Stage Switcher Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          type="button"
          onClick={handlePrev}
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={14} /> Prev Stage
        </button>

        {/* Stage Dot Indicators */}
        <div style={{ display: 'flex', gap: 4 }}>
          {PIPELINE_STAGES.map((_, i) => (
            <span
              key={i}
              onClick={() => setActiveStageIndex(i)}
              style={{
                width: i === activeStageIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeStageIndex ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          Next Stage <ChevronRight size={14} />
        </button>
      </div>

      {/* Stage Detail Bottom Sheet Modal */}
      {selectedDetailStage && (
        <div className="mobile-modal-overlay" onClick={() => setSelectedDetailStage(null)}>
          <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⛏️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedDetailStage.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--accent-teal)' }}>
                    Stage {selectedDetailStage.number} • {selectedDetailStage.agentName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailStage(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-modal-body">
              {/* Machinery Field Photo */}
              {selectedDetailStage.image && (
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-hairline)' }}>
                  <img
                    src={selectedDetailStage.image}
                    alt={selectedDetailStage.machineryTag || selectedDetailStage.title}
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                  {selectedDetailStage.imageCaption && (
                    <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}>
                      {selectedDetailStage.imageCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedDetailStage.description}
              </div>

              {/* Specific Stage Capabilities */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  STAGE CAPABILITIES & INVARIANTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedDetailStage.details.map((dt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 6,
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span> {dt}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="mobile-btn-touch mobile-btn-primary"
                onClick={() => setSelectedDetailStage(null)}
              >
                Close Stage Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
