import React from 'react';
import { HelpCircle, ShieldCheck, Award, Cpu, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const HelpTrainingPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(31, 138, 92, 0.1)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <HelpCircle size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Mining Intelligence Standards, SOPs & Governance Guidelines
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Standard operating procedures for CIL subsidiaries, DGMS safety compliance, and ISO/IEC 25010 evaluation benchmarks.
            </span>
          </div>
        </div>

        <Badge variant="primary">OFFICIAL CMPDI REFERENCE</Badge>
      </div>

      {/* Guidelines Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* 1. DGMS Compliance */}
        <div className="card-level-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>DGMS Statutory Safety Guidelines</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Mandates reporting standards for open-cast and underground operations under the Coal Mines Regulations (CMR).
            All safety incident figures (fatalities, serious injuries, and Lost Time Injury Frequency Rates) are extracted with 100% ground-truth provenance.
          </p>
        </div>

        {/* 2. ISO/IEC 25010 Quality Model */}
        <div className="card-level-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Award size={20} style={{ color: 'var(--accent-teal)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>ISO/IEC 25010 Quality Benchmark</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Defines the 8 formal quality benchmark KPIs, distinguishing project targets from actual empirical test results.
            Enforces evidence-grounded response gating across all AI generated answers and reports.
          </p>
        </div>

        {/* 3. 8-Agent Architecture */}
        <div className="card-level-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Cpu size={20} style={{ color: 'var(--status-warning)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>8-Agent Manager-Worker Architecture</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The platform orchestrates 1 Manager agent and 7 specialized worker agents (Document Intelligence, Retrieval, Mining Intelligence, Validation, Quality Governance, Report Generation, and Parliamentary Inquiries) with deterministic DAG provenance.
          </p>
        </div>

        {/* 4. Reviewing Officer Sign-Off SOP */}
        <div className="card-level-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Landmark size={20} style={{ color: 'var(--text-primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Reviewing Officer Statutory Sign-Off</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Human-in-the-Loop (HITL) protocol: No AI generated executive report or parliamentary answer may be officially published or exported without explicit Reviewing Officer verification and cryptographic seal.
          </p>
        </div>
      </div>
    </div>
  );
};
