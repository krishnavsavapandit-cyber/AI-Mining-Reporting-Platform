/**
 * GeoNexus Design Tokens — Single Source of Truth
 * Geological, Mining & Statutory Intelligence Operating Environment
 * 
 * Token System Specification:
 * - Saturated Accent: Institutional Emerald (#10B981) / Deep Forest (#059669)
 * - Tonal Foundation: Deep Obsidian (#0B0E14), Elevated Slate (#111620, #171F2C)
 * - Geological Strata Highlights: Earth Taupe (#D4A373), Raw Umber (#8B7355), Sand Strata (#E9D8A6)
 * - Semantic alerts: Amber Warning (#F59E0B), Critical Red (#EF4444), Verified Success (#10B981)
 * - Typography: Geist / Inter (UI), Geist Mono / JetBrains Mono (Numeric/IDs, tabular-nums)
 * - Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px
 * - Radius: 4px (inputs/badges), 8px (cards/panels), 12px (modals/sheets), 9999px (pills)
 * - Elevation: Level 0 (flat), Level 1 (subtle border/glow), Level 2 (hero elevated)
 */

export const COLOR = {
  // Foundation
  bgBase: '#0B0E14',
  bgSurface: '#111620',
  bgSurface2: '#171F2C',
  bgSurface3: '#1E293B',
  bgSurfaceTinted: 'rgba(16, 185, 129, 0.05)',

  // Borders & Dividers
  borderHairline: 'rgba(255, 255, 255, 0.08)',
  borderHairlineAlt: 'rgba(255, 255, 255, 0.14)',
  borderEmerald: 'rgba(16, 185, 129, 0.25)',
  graphite: '#1F2937',
  slate: '#374151',

  // Saturated Accents
  accentPrimary: '#10B981',
  accentPrimaryHover: '#059669',
  accentPrimaryMuted: '#064E3B',
  accentTeal: '#14B8A6',
  accentCyan: '#06B6D4',

  // Geological Strata Motifs
  strataSand: '#E9D8A6',
  strataTaupe: '#D4A373',
  strataUmber: '#8B7355',
  strataCoal: '#1E2024',

  // Semantic Status
  statusWarning: '#F59E0B',
  statusError: '#EF4444',
  statusSuccess: '#10B981',
  statusInfo: '#3B82F6',

  // Typography
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textEmerald: '#34D399',
} as const;

export const TYPOGRAPHY = {
  fontUi: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  scale: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '36px',
    '4xl': '48px',
  },
} as const;

export const SPACING = {
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '6': '24px',
  '8': '32px',
  '12': '48px',
  '16': '64px',
  '24': '96px',
} as const;

export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export const ELEVATION = {
  level0: 'none',
  level1: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  level2: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  emeraldGlow: '0 0 20px rgba(16, 185, 129, 0.15)',
} as const;
