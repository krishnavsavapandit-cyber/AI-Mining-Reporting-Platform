import React from 'react';
import { ShieldCheck, Cpu, Database, ArrowRight } from 'lucide-react';
import { NavigationTab } from '@/components/layout/Sidebar';
import { MobileMineCart } from '@/components/mobile/MobileMineCart';
import { MiningLogo } from '@/components/ui/MiningLogo';

interface MobileOverviewViewProps {
  onEnterWorkspace: (tab?: NavigationTab) => void;
  docCount?: number;
  conflictsCount?: number;
}

export const MobileOverviewView: React.FC<MobileOverviewViewProps> = ({
  onEnterWorkspace,
}) => {
  return (
    <div className="mobile-main-viewport">
      {/* Hero Banner */}
      <div
        className="mobile-card"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(11, 16, 26, 0.85), rgba(7, 10, 15, 0.98)), url("/images/open_surface_mine.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '20px 16px',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MiningLogo size={32} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              GeoNexus
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}>
              National Mining Intelligence Platform
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          Autonomous Multi-Source Document Intelligence, Geological OCR, and Mathematical Discrepancy Engine for Coal India & Ministry of Coal.
        </p>

        <button
          type="button"
          className="mobile-btn-touch mobile-btn-primary"
          onClick={() => onEnterWorkspace('dashboard')}
        >
          Enter Executive Command Center <ArrowRight size={15} />
        </button>
      </div>

      {/* Signature Mobile Mine Cart */}
      <MobileMineCart onSelectStageAction={() => onEnterWorkspace('agents')} />

      {/* Core Capabilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
          PLATFORM ARCHITECTURE & PILLARS
        </div>

        <div className="mobile-card" onClick={() => onEnterWorkspace('documents')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} style={{ color: 'var(--accent-teal)' }} />
            <h4 className="mobile-card-title">01. Multi-Format Ingestion & Geological OCR</h4>
          </div>
          <p className="mobile-card-subtitle">
            PyMuPDF direct parsing + Tesseract 5.x OCR for scanned borehole stratigraphy and core logs with SHA-256 provenance.
          </p>
        </div>

        <div className="mobile-card" onClick={() => onEnterWorkspace('validation')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} style={{ color: '#F59E0B' }} />
            <h4 className="mobile-card-title">02. Mathematical Discrepancy Engine</h4>
          </div>
          <p className="mobile-card-subtitle">
            Automated cross-document variance detection between shovel extraction logs and annual statutory filings.
          </p>
        </div>

        <div className="mobile-card" onClick={() => onEnterWorkspace('agents')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} style={{ color: '#A78BFA' }} />
            <h4 className="mobile-card-title">03. 8-Agent Autonomous DAG</h4>
          </div>
          <p className="mobile-card-subtitle">
            Deterministic Manager-Worker Directed Acyclic Graph with independent QualityGovernance release gatekeeper.
          </p>
        </div>
      </div>
    </div>
  );
};
