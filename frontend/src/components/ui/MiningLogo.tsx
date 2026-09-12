import React from 'react';

interface MiningLogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon' | 'monochrome';
}

/**
 * Custom Geological Strata & Drill-Core SVG Mark for CIL / CMPDI
 * Minimal, geometric, recognizable at 16px, usable in monochrome.
 */
export const MiningLogo: React.FC<MiningLogoProps> = ({
  size = 24,
  className = '',
  variant = 'icon',
}) => {
  const primaryColor = variant === 'monochrome' ? 'currentColor' : '#1F8A5C';
  const tealColor = variant === 'monochrome' ? 'currentColor' : '#2D9CA8';
  const mutedColor = variant === 'monochrome' ? 'currentColor' : '#2E5B45';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CIL Geological Strata Logo"
    >
      {/* Top Strata Layer (Surface / Overburden) */}
      <path
        d="M3 5.5C3 5.5 8 4 12 4C16 4 21 5.5 21 5.5"
        stroke={primaryColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Middle Strata Layer (Coal Seam & Exploration Plane) */}
      <path
        d="M3 11C3 11 8 9.5 12 9.5C16 9.5 21 11 21 11"
        stroke={tealColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Basal Strata Layer (Bedrock Horizon) */}
      <path
        d="M3 16.5C3 16.5 8 15 12 15C16 15 21 16.5 21 16.5"
        stroke={mutedColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Vertical Core Borehole Indicator */}
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="21"
        stroke={primaryColor}
        strokeWidth="1.8"
        strokeDasharray="2 2"
      />

      {/* Core Sample Intersection Node */}
      <circle cx="12" cy="11" r="2.2" fill={primaryColor} />
      <circle cx="12" cy="16.5" r="1.5" fill={tealColor} />
    </svg>
  );
};
