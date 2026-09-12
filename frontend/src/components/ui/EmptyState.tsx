import React from 'react';
import { EmptyStateIllustration } from './EmptyStateIllustration';

interface EmptyStateProps {
  title: string;
  description: string;
  type?: 'documents' | 'reports' | 'discrepancy' | 'topics' | 'search' | 'audit' | 'general';
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  type = 'general',
  action,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
      }}
    >
      <EmptyStateIllustration type={type} size={110} />
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          maxWidth: '440px',
          lineHeight: '1.5',
          marginBottom: action ? '20px' : '0',
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
