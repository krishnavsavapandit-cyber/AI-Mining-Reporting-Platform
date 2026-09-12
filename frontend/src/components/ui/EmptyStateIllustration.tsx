import React from 'react';

interface EmptyStateIllustrationProps {
  type?: 'documents' | 'reports' | 'discrepancy' | 'topics' | 'search' | 'audit' | 'general';
  size?: number;
}

/**
 * Custom Geological Strata & Mining Operations SVG Illustrations for Empty States
 */
export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type = 'general',
  size = 120,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', margin: '0 auto 16px' }}
    >
      {/* Background Geological Strata Layers */}
      <rect x="20" y="80" width="120" height="28" rx="4" fill="#181C22" stroke="rgba(255, 255, 255, 0.08)" />
      <path d="M25 92C45 88 75 96 100 90C115 86 135 92 135 92" stroke="#2E5B45" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 100C50 98 80 102 110 98C125 96 135 100 135 100" stroke="#1F8A5C" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Central Horizon Platform */}
      <rect x="40" y="32" width="80" height="52" rx="6" fill="#12151A" stroke="rgba(255, 255, 255, 0.14)" />

      {type === 'documents' && (
        <g>
          {/* Stacked Sheet Vector */}
          <rect x="52" y="42" width="56" height="34" rx="3" fill="#181C22" stroke="#2D9CA8" strokeWidth="1.5" />
          <line x1="60" y1="50" x2="96" y2="50" stroke="#8B929E" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="58" x2="88" y2="58" stroke="#8B929E" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="66" x2="78" y2="66" stroke="#1F8A5C" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {type === 'discrepancy' && (
        <g>
          {/* Dual Document Comparison Nodes */}
          <rect x="48" y="44" width="28" height="30" rx="3" fill="#181C22" stroke="#D9A441" strokeWidth="1.5" />
          <rect x="84" y="44" width="28" height="30" rx="3" fill="#181C22" stroke="#1F8A5C" strokeWidth="1.5" />
          <path d="M76 59L84 59" stroke="#E8EAED" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="80" cy="59" r="2.5" fill="#D9A441" />
        </g>
      )}

      {type === 'topics' && (
        <g>
          {/* Connected Keyword Nodes */}
          <circle cx="60" cy="56" r="10" fill="#181C22" stroke="#1F8A5C" strokeWidth="1.5" />
          <circle cx="100" cy="54" r="12" fill="#181C22" stroke="#2D9CA8" strokeWidth="1.5" />
          <circle cx="80" cy="68" r="8" fill="#181C22" stroke="#2E5B45" strokeWidth="1.5" />
          <line x1="68" y1="56" x2="90" y2="55" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          <line x1="66" y1="63" x2="74" y2="66" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          <line x1="94" y1="62" x2="86" y2="66" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
        </g>
      )}

      {type === 'reports' && (
        <g>
          <rect x="55" y="40" width="50" height="38" rx="4" fill="#181C22" stroke="#1F8A5C" strokeWidth="1.5" />
          <circle cx="80" cy="52" r="6" fill="rgba(31, 138, 92, 0.2)" stroke="#1F8A5C" strokeWidth="1.5" />
          <path d="M77 52L79 54L83 50" stroke="#1F8A5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="64" y1="66" x2="96" y2="66" stroke="#8B929E" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {type === 'search' && (
        <g>
          <circle cx="75" cy="55" r="14" fill="#181C22" stroke="#2D9CA8" strokeWidth="1.8" />
          <line x1="85" y1="65" x2="96" y2="76" stroke="#2D9CA8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="75" cy="55" r="4" fill="#1F8A5C" />
        </g>
      )}

      {(type === 'general' || type === 'audit') && (
        <g>
          <circle cx="80" cy="58" r="14" fill="#181C22" stroke="#3A3F47" strokeWidth="1.5" />
          <line x1="80" y1="50" x2="80" y2="58" stroke="#1F8A5C" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="58" x2="86" y2="62" stroke="#2D9CA8" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Surface Geological Drill Core Line */}
      <line x1="80" y1="16" x2="80" y2="32" stroke="#1F8A5C" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="80" cy="16" r="2.5" fill="#1F8A5C" />
    </svg>
  );
};
