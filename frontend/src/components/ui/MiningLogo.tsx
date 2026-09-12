import React from 'react';

interface MiningLogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon' | 'monochrome';
}

/**
 * GeoNexus Emerald Geological Mark
 * Stylized faceted diamond/hexagonal nexus polygon with internal geological core vectors.
 */
export const MiningLogo: React.FC<MiningLogoProps> = ({
  size = 28,
  className = '',
  variant = 'icon',
}) => {
  const primaryColor = variant === 'monochrome' ? 'currentColor' : '#10B981';
  const secondaryColor = variant === 'monochrome' ? 'currentColor' : '#059669';
  const coreColor = variant === 'monochrome' ? 'currentColor' : '#34D399';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GeoNexus Logo"
    >
      <defs>
        <linearGradient id="geoNexusGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="facetGrad" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
        </linearGradient>
      </defs>

      {/* Hexagonal Outer Nexus Frame */}
      <path
        d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
        fill="url(#geoNexusGrad)"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Internal Facet Overlay */}
      <path
        d="M16 3L27 9.5L16 16L5 9.5L16 3Z"
        fill="url(#facetGrad)"
        opacity="0.6"
      />

      {/* Geological Strata Core & Borehole lines */}
      <path
        d="M5 9.5L16 16L27 9.5"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M16 16V29"
        stroke={secondaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 22.5L16 16L27 22.5"
        stroke="rgba(0, 0, 0, 0.3)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Center Nexus Geode Node */}
      <circle cx="16" cy="16" r="3" fill="#FFFFFF" opacity="0.9" />
      <circle cx="16" cy="16" r="1.5" fill={coreColor} />
    </svg>
  );
};
