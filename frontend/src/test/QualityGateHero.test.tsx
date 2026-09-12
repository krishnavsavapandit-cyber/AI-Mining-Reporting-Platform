import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QualityGateHero } from '@/components/ui/QualityGateHero';
import { QualityReport } from '@/types';

describe('QualityGateHero Component (Agent 8 Release Governance)', () => {
  it('renders PASS decision banner with checks and zero violations', () => {
    const report: QualityReport = {
      decision: 'PASS',
      checks_passed: [
        'Zero numerical discrepancies >5%',
        'All facts cite source document chunks',
      ],
      violations: [],
      warnings: [],
      summary: 'All release governance constraints satisfied.',
    };

    render(<QualityGateHero report={report} />);

    expect(screen.getByText(/ISO\/IEC 25010 Quality Gate Verification/i)).toBeInTheDocument();
    expect(screen.getByText('PASS')).toBeInTheDocument();
    expect(screen.getByText(/Zero numerical discrepancies >5%/i)).toBeInTheDocument();
  });

  it('renders REJECTED decision banner with violation details', () => {
    const report: QualityReport = {
      decision: 'REJECTED',
      checks_passed: [],
      violations: ['High-variance discrepancy detected (18.4% variance) without human review sign-off.'],
      warnings: ['Missing subsidiary borehole verification.'],
      summary: 'Release blocked by Agent 8.',
    };

    render(<QualityGateHero report={report} />);

    expect(screen.getByText(/ISO\/IEC 25010 Quality Gate Verification/i)).toBeInTheDocument();
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
    expect(screen.getByText(/High-variance discrepancy detected/i)).toBeInTheDocument();
    expect(screen.getByText('Missing subsidiary borehole verification.')).toBeInTheDocument();
  });
});
