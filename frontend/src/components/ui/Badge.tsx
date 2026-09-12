import React from 'react';

export type BadgeVariant = 'primary' | 'teal' | 'warning' | 'error' | 'slate';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
  icon,
  style,
  pulse = false,
}) => {
  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        ...style,
        position: 'relative',
      }}
    >
      {pulse && (
        <span
          className="status-dot status-dot-success"
          style={{ width: 6, height: 6, marginRight: 2 }}
        />
      )}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
