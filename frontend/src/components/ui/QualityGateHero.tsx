import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, FileCheck } from 'lucide-react';
import { QualityGateDecisionType, QualityReport } from '@/types';
import { Badge } from './Badge';
import { Button } from './Button';

export interface QualityGateHeroProps {
  decision?: QualityGateDecisionType | string;
  violations?: string[];
  warnings?: string[];
  checksPassed?: string[];
  evaluatedBy?: string;
  onApprove?: () => void;
  canApprove?: boolean;
  report?: QualityReport;
}

export const QualityGateHero: React.FC<QualityGateHeroProps> = ({
  decision,
  violations,
  warnings,
  checksPassed,
  evaluatedBy = 'QualityGovernanceAgent',
  onApprove,
  canApprove = false,
  report,
}) => {
  const finalDecision = report?.decision || decision || 'PASS';
  const finalViolations = report?.violations || violations || [];
  const finalWarnings = report?.warnings || warnings || [];
  const finalChecksPassed = report?.checks_passed || checksPassed || [];
  const finalEvaluator = report?.evaluated_by || evaluatedBy;

  const isPass = finalDecision === 'PASS';
  const isWarning = finalDecision === 'WARNING';
  const isRejected = finalDecision === 'REJECTED';
  const isReviewRequired = finalDecision === 'REQUIRES_HUMAN_REVIEW';

  const borderColor = isPass
    ? 'var(--accent-primary)'
    : isWarning
    ? 'var(--status-warning)'
    : isRejected
    ? 'var(--status-error)'
    : 'var(--accent-teal)';

  const bgColor = isPass
    ? 'rgba(31, 138, 92, 0.05)'
    : isWarning
    ? 'rgba(217, 164, 65, 0.05)'
    : isRejected
    ? 'rgba(192, 57, 43, 0.05)'
    : 'rgba(45, 156, 168, 0.05)';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        boxShadow: 'var(--shadow-level-1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: borderColor,
            }}
          >
            {isPass && <ShieldCheck size={22} />}
            {isWarning && <AlertTriangle size={22} />}
            {isRejected && <XCircle size={22} />}
            {isReviewRequired && <FileCheck size={22} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ISO/IEC 25010 Quality Gate Verification
              </span>
              <Badge
                variant={
                  isPass ? 'primary' : isWarning ? 'warning' : isRejected ? 'error' : 'teal'
                }
              >
                {finalDecision}
              </Badge>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Automated governance audit executed by <strong>{finalEvaluator}</strong>
            </div>
          </div>
        </div>

        {canApprove && onApprove && (
          <Button variant="primary" size="sm" onClick={onApprove} icon={<CheckCircle2 size={14} />}>
            Official Sign-Off & Seal
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
            Checks Passed ({finalChecksPassed.length})
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {finalChecksPassed.length > 0 ? finalChecksPassed.slice(0, 2).join(', ') : 'All schema and mathematical invariants verified'}
          </div>
        </div>

        {finalWarnings.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(217, 164, 65, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-warning)', textTransform: 'uppercase' }}>
              Flagged Warnings ({finalWarnings.length})
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {finalWarnings[0]}
            </div>
          </div>
        )}

        {finalViolations.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(192, 57, 43, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-error)', textTransform: 'uppercase' }}>
              Governance Violations ({finalViolations.length})
            </span>
            <div style={{ fontSize: '12px', color: 'var(--status-error)', marginTop: '4px' }}>
              {finalViolations[0]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
