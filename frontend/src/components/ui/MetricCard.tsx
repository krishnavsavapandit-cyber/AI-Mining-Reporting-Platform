import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
  level?: 1 | 2;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  icon,
  trend,
  trendPositive,
  highlight = false,
  level = 1,
  onClick,
}) => {
  return (
    <div
      className={level === 2 ? 'card-level-2' : 'card-level-1'}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: highlight ? '3px solid var(--accent-primary)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon && <span style={{ color: highlight ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          className="text-mono"
          style={{
            fontSize: level === 2 ? '28px' : '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px' }}>
          {subtitle && <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
          {trend && (
            <span
              className="text-mono"
              style={{
                color: trendPositive ? 'var(--accent-primary)' : 'var(--status-warning)',
                fontWeight: 600,
              }}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
