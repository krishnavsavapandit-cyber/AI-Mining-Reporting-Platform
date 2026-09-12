/**
 * SIH26023 Design Tokens — Single Source of Truth
 * Coal India Limited / CMPDI AI Multi-Agent Mining Intelligence Platform
 * 
 * Token System Specification:
 * - Saturated Accent: Institutional Green (#1F8A5C) on <10% of pixels
 * - Tonal Foundation: Near-black (#0B0D10), Elevated surfaces (#12151A, #181C22)
 * - Secondary highlights: Data Teal (#2D9CA8), Muted Forest (#2E5B45)
 * - Semantic alerts: Amber Warning (#D9A441), Critical Red (#C0392B)
 * - Typography: Geist / Inter (UI), Geist Mono / JetBrains Mono (Numeric/IDs, tabular-nums)
 * - Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px
 * - Radius: 4px (inputs/badges), 8px (cards/panels), 12px (modals/sheets)
 * - Elevation: Level 0 (flat), Level 1 (card hairline), Level 2 (hero elevated)
 */

export const COLOR = {
  // Foundation
  bgBase: '#0B0D10',
  bgSurface: '#12151A',
  bgSurface2: '#181C22',
  bgSurfaceTinted: 'rgba(31, 138, 92, 0.04)',

  // Borders & Dividers
  borderHairline: 'rgba(255, 255, 255, 0.08)',
  borderHairlineAlt: 'rgba(255, 255, 255, 0.14)',
  graphite: '#2A2E35',
  slate: '#3A3F47',

  // Saturated Accent
  accentPrimary: '#1F8A5C',
  accentPrimaryMuted: '#2E5B45',
  accentTeal: '#2D9CA8',

  // Semantic Status
  statusWarning: '#D9A441',
  statusError: '#C0392B',
  statusSuccess: '#1F8A5C',

  // Typography
  textPrimary: '#E8EAED',
  textSecondary: '#8B929E',
  textMuted: '#565C66',
} as const;

export const TYPOGRAPHY = {
  fontUi: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'Geist Mono', 'JetBrains Mono', monospace",
  scale: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
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
} as const;

export const ELEVATION = {
  level0: 'none',
  level1: '0 1px 2px rgba(0, 0, 0, 0.4)',
  level2: '0 4px 16px rgba(0, 0, 0, 0.5)',
} as const;
