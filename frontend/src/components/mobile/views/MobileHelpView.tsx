import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SOPS = [
  {
    title: 'DGMS Opencast Bench Height & Slope Invariants',
    category: 'Safety & Statutory',
    content:
      'Under Directorate General of Mines Safety (DGMS) circulars, the height of benches in alluvial soil/overburden must not exceed 3 metres, and in coal seams with mechanical excavators, bench heights are strictly regulated between 15–20 metres with minimum haul road widths of 3x dumper width plus 1.5m clearance.',
  },
  {
    title: 'Indian Coal GCV Grading Framework (G1 to G17)',
    category: 'Quality Math',
    content:
      'Gross Calorific Value (GCV) banding ranges from Grade G1 (> 7,000 kcal/kg) to G17 (2,200 – 2,500 kcal/kg). GeoNexus automates calorific conversion from proximate analysis (Moisture % and Ash %) to verify pricing slabs and subsidiary billing reconciliation.',
  },
  {
    title: 'Stripping Ratio (OBR / Coal) Calculation Rules',
    category: 'Mining Intelligence',
    content:
      'The Stripping Ratio is the volume of Overburden Removal (OBR in Million Cubic Metres, MCuM) required to extract one Metric Tonne (MT) of raw coal. GeoNexus continuously recalculates this ratio against 3D strata seam models to flag anomalous shovel loading reports.',
  },
  {
    title: '8-Agent Manager-Worker Concurrency & Governance',
    category: 'System Architecture',
    content:
      'GeoNexus uses a deterministic Manager-Worker Directed Acyclic Graph. The QualityGovernanceAgent independently reviews synthesis output citations before issuing PASS verdicts to enforce zero hallucinations.',
  },
];

export const MobileHelpView: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="mobile-main-viewport">
      {/* Header */}
      <div className="mobile-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle size={18} />
          </div>
          <div>
            <h3 className="mobile-card-title">CIL Domain SOPs & Standards</h3>
            <p className="mobile-card-subtitle">DGMS compliance, GCV math & operational guidelines</p>
          </div>
        </div>
      </div>

      {/* Accordion FAQ Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SOPS.map((sop, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div
              key={i}
              className="mobile-card"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              style={{ cursor: 'pointer', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)' }}>
                    {sop.category}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    {sop.title}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {isExpanded && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    paddingTop: 6,
                    borderTop: '1px solid var(--border-hairline)',
                    margin: 0,
                  }}
                >
                  {sop.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
