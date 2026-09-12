import { Chart } from 'chart.js';
import { COLOR, TYPOGRAPHY } from '@/styles/tokens';

/**
 * Configure global Chart.js defaults to enforce SIH26023 design system
 * No default chart library colors, gridlines, fonts or tooltips.
 */
export function applyChartDefaults() {
  Chart.defaults.color = COLOR.textSecondary;
  Chart.defaults.font.family = TYPOGRAPHY.fontUi;
  Chart.defaults.font.size = 12;

  // Global Tooltip Configuration
  Chart.defaults.plugins.tooltip.backgroundColor = COLOR.bgSurface2;
  Chart.defaults.plugins.tooltip.titleColor = COLOR.textPrimary;
  Chart.defaults.plugins.tooltip.bodyColor = COLOR.textSecondary;
  Chart.defaults.plugins.tooltip.borderColor = COLOR.borderHairlineAlt;
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
  Chart.defaults.plugins.tooltip.titleFont = {
    family: TYPOGRAPHY.fontUi,
    size: 12,
    weight: 'bold',
  };
  Chart.defaults.plugins.tooltip.bodyFont = {
    family: TYPOGRAPHY.fontMono,
    size: 12,
  };
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 4;

  // Global Legend Configuration
  Chart.defaults.plugins.legend.labels.color = COLOR.textSecondary;
  Chart.defaults.plugins.legend.labels.font = {
    family: TYPOGRAPHY.fontUi,
    size: 12,
  };
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.boxHeight = 12;
  Chart.defaults.plugins.legend.labels.padding = 16;
}

/**
 * Restrained palette sequence for multi-series charts
 */
export const CHART_PALETTE = [
  COLOR.accentPrimary,       // Institutional Green
  COLOR.accentTeal,          // Secondary Data Highlight
  COLOR.accentPrimaryMuted,  // Desaturated Green
  COLOR.statusWarning,       // Amber
  COLOR.slate,               // Slate
  COLOR.graphite,            // Graphite
  COLOR.statusError,         // Red
];

/**
 * Common chart gridline & scale theme options
 */
export const baseScaleOptions = {
  grid: {
    color: 'rgba(255, 255, 255, 0.05)',
    borderColor: COLOR.borderHairline,
    tickColor: 'rgba(255, 255, 255, 0.08)',
  },
  ticks: {
    color: COLOR.textMuted,
    font: {
      family: TYPOGRAPHY.fontMono,
      size: 11,
    },
    padding: 6,
  },
};
