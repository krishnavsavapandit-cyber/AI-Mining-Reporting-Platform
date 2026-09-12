import React from 'react';
import {
  FileText,
  Search,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Landmark,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Sparkles,
  ChevronDown,
  Scale,
  UserCheck,
  ShieldAlert,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { NavigationTab } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface GeoNexusLandingProps {
  onEnterWorkspace: (targetTab?: NavigationTab) => void;
  docCount?: number;
  conflictsCount?: number;
  aiProviderName?: string;
  aiProviderOnline?: boolean;
}

export const GeoNexusLanding: React.FC<GeoNexusLandingProps> = ({
  onEnterWorkspace,
  docCount = 0,
  conflictsCount = 0,
  aiProviderName = 'Gemini Grounded Engine',
  aiProviderOnline = true,
}) => {
  const { role, setRole } = useAuth();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100%', overflowX: 'hidden' }}>
      {/* =========================================================================
          1. HERO SECTION (Exact Reference Header & Hero)
          ========================================================================= */}
      <section
        style={{
          position: 'relative',
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: 'linear-gradient(to bottom, rgba(11, 14, 20, 0.75) 0%, rgba(11, 14, 20, 0.6) 40%, rgba(11, 14, 20, 0.98) 100%), url("/assets/hero_mine.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        {/* Navigation Bar */}
        <header
          style={{
            height: '70px',
            padding: '0 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(11, 14, 20, 0.6)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <MiningLogo size={32} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                GeoNexus
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection('governance-pipeline')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Governance
            </button>
            <button
              onClick={() => scrollToSection('impact')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Impact
            </button>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Quick Role Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Role:
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{
                  padding: '5px 8px',
                  backgroundColor: 'rgba(23, 31, 44, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ANALYST">Mining Analyst</option>
                <option value="OFFICER">Reviewing Officer</option>
                <option value="ADMIN">System Admin</option>
                <option value="VIEWER">Public Auditor</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => onEnterWorkspace('dashboard')}
              style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}
            >
              Explore Platform
            </button>
          </div>
        </header>

        {/* Hero Content Center */}
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '80px 24px 60px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: 'var(--text-emerald)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              marginBottom: 24,
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
            }}
          >
            <Sparkles size={14} />
            <span>Autonomous 8-Agent Mining & Geological Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: 'clamp(34px, 5.2vw, 58px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              maxWidth: '960px',
              marginBottom: 20,
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
            }}
          >
            Mining Intelligence, Grounded in Evidence.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 19px)',
              lineHeight: 1.6,
              color: '#D1D5DB',
              maxWidth: '780px',
              marginBottom: 36,
              fontWeight: 400,
            }}
          >
            Transform geological and mining reports into validated, traceable intelligence through an orchestrated 8-agent AI platform.
          </p>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onEnterWorkspace('dashboard')}
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>Explore Platform</span>
              <ArrowRight size={16} />
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => scrollToSection('how-it-works')}
              style={{
                backgroundColor: 'rgba(23, 31, 44, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                backdropFilter: 'blur(4px)',
              }}
            >
              See How It Works
            </button>
          </div>

          {/* Quick Telemetry Strip */}
          <div
            style={{
              marginTop: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              padding: '10px 24px',
              backgroundColor: 'rgba(11, 14, 20, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(8px)',
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={aiProviderOnline ? 'status-dot status-dot-success' : 'status-dot status-dot-warning'} />
              <span style={{ color: 'var(--text-secondary)' }}>8 Active Autonomous Agents</span>
            </div>
            <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={13} style={{ color: 'var(--accent-teal)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {docCount} Ingested Documents
              </span>
            </div>
            {conflictsCount > 0 && (
              <>
                <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={13} style={{ color: 'var(--status-warning)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {conflictsCount} Discrepancies Tracked
                  </span>
                </div>
              </>
            )}
            <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={13} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{aiProviderName}</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: 16,
            cursor: 'pointer',
            opacity: 0.7,
          }}
          onClick={() => scrollToSection('mine-cart-section')}
        >
          <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </section>

      {/* =========================================================================
          2. MINE-CART VISUAL & GEOLOGICAL STRATA TRANSITION (Exact Reference Section)
          ========================================================================= */}
      <section
        id="mine-cart-section"
        style={{
          position: 'relative',
          padding: '70px 24px 80px',
          backgroundColor: '#F3F4F6',
          color: '#111827',
          borderBottom: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 28 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#059669',
                display: 'block',
                marginBottom: 6,
              }}
            >
              MINE-CART VISUAL
            </span>
            <p style={{ fontSize: 14, color: '#4B5563', maxWidth: '640px', margin: '0 auto' }}>
              Subtle underground mining strata to accent visual transitions across geological layers and analytical depths.
            </p>
          </div>

          {/* Mine Cart Image on Geological Strata */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              maxHeight: '440px',
            }}
          >
            <img
              src="/assets/mine_cart.jpg"
              alt="Industrial Coal Cart on Geological Strata Rails"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '440px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS — 8-AGENT ORCHESTRATION FLOW (Exact Reference Workflow)
          ========================================================================= */}
      <section
        id="how-it-works"
        style={{
          padding: '90px 24px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-primary)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              8-AGENT DAG ORCHESTRATION
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                marginBottom: 14,
              }}
            >
              HOW IT WORKS
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto' }}>
              An autonomous multi-agent pipeline where specialized agents execute directed tasks with verification checkpoints, validation gates, and human oversight.
            </p>
          </div>

          {/* 8-Agent Workflow Tree Map */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 32,
              position: 'relative',
            }}
          >
            {/* Left Branch: Ingestion & Intelligence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.08em',
                  paddingLeft: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="status-dot status-dot-success" />
                <span>Stage I: Exploration & Retrieval</span>
              </div>

              {/* Agent 01 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid var(--accent-primary)',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    01 — Manager / Orchestrator
                  </span>
                  <span className="badge badge-primary">Coordination</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Plans and coordinates the workflow
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Dynamically constructs task DAGs, tracks dependencies, triggers parallel sub-tasks, and handles bounded retries.
                </p>
              </div>

              {/* Agent 02 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid var(--accent-teal)',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>
                    02 — Document Intelligence
                  </span>
                  <span className="badge badge-teal">Extraction</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Understands documents and structured extraction
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Processes PDF, OCR, DOCX, CSV, and XLSX files; performs SHA-256 fingerprinting, classification, chunking, and fact harvesting.
                </p>
              </div>

              {/* Agent 03 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid #3B82F6',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                    03 — Retrieval & Evidence
                  </span>
                  <span className="badge badge-slate">Hybrid RRF</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Finds relevant context and supporting citations
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Executes dual keyword + dense vector retrieval with Reciprocal Rank Fusion, attaching strict chunk provenance to all answers.
                </p>
              </div>

              {/* Agent 04 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid #8B5CF6',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', fontFamily: 'var(--font-mono)' }}>
                    04 — Mining Intelligence
                  </span>
                  <span className="badge badge-slate">Analytics</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Entities, KPIs, units, trends, comparisons, anomalies
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Performs coal metric normalization (MT, Tonnes, Lakh Te), time-series variance analysis, and operational anomaly detection.
                </p>
              </div>
            </div>

            {/* Right Branch: Validation, Reports & Quality Governance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--status-warning)',
                  letterSpacing: '0.08em',
                  paddingLeft: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="status-dot status-dot-warning" />
                <span>Stage II: Verification & Statutory Release</span>
              </div>

              {/* Agent 05 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid var(--status-warning)',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-warning)', fontFamily: 'var(--font-mono)' }}>
                    05 — Validation & Audit
                  </span>
                  <span className="badge badge-warning">Cross-Check</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Cross-checks calculations, metrics, consistency, and compliance
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Identifies multi-source discrepancies (e.g. Rajmahal monthly vs target reports), computes exact variance %, and queues human review.
                </p>
              </div>

              {/* Agent 06 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid #10B981',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                    06 — Report Generation
                  </span>
                  <span className="badge badge-primary">Synthesis</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Produces structured statutory reports with evidence citations
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Compiles standardized statutory reports, executive briefings, and automated exports in PDF and DOCX formats.
                </p>
              </div>

              {/* Agent 07 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid #EC4899',
                  backgroundColor: 'var(--bg-surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#F472B6', fontFamily: 'var(--font-mono)' }}>
                    07 — Government Inquiry
                  </span>
                  <span className="badge badge-slate">Statutory</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Prepares evidence-backed inquiry responses with human verification
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Drafts parliamentary Lok Sabha/Rajya Sabha responses with mandatory officer sign-off checkpoints before release.
                </p>
              </div>

              {/* Agent 08 */}
              <div
                className="card-level-1"
                style={{
                  borderLeft: '4px solid #10B981',
                  backgroundColor: 'var(--bg-surface-2)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    08 — Quality & Governance
                  </span>
                  <span className="badge badge-primary">Quality Gate</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Evaluates quality, provenance, and release readiness
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Enforces zero-hallucination compliance, citation density rules, and acts as an unbypassable gate to block invalid releases.
                </p>
              </div>
            </div>
          </div>

          {/* Action to monitor */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              className="btn btn-outline"
              onClick={() => onEnterWorkspace('agents')}
              style={{ padding: '8px 20px', fontSize: 13, borderColor: 'var(--border-emerald)' }}
            >
              <span>Open 8-Agent Live Monitor</span>
              <ArrowRight size={14} style={{ color: 'var(--accent-primary)' }} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. KEY CAPABILITIES (Exact Reference 8-Card Grid + Stack View)
          ========================================================================= */}
      <section
        id="capabilities"
        style={{
          padding: '90px 24px',
          backgroundColor: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-primary)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              ENTERPRISE PLATFORM
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                marginBottom: 14,
              }}
            >
              KEY CAPABILITIES
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
              Premium AI-powered and mining intelligence for operational excellence across Coal India & subsidiaries.
            </p>
          </div>

          {/* 8 Capability Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
              marginBottom: 48,
            }}
          >
            {/* 1. Document Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)' }}>
                  <FileText size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Document Intelligence</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                PDF, scanned PDF, DOCX, CSV, XLSX, Image OCR processing with deduplication and metadata extraction.
              </p>
            </div>

            {/* 2. Evidence-Grounded Retrieval */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)' }}>
                  <Search size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Evidence-Grounded Retrieval</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Search information and trace results back to supporting evidence chunks with strict page and line provenance.
              </p>
            </div>

            {/* 3. Mining Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA' }}>
                  <TrendingUp size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Mining Intelligence</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Entities, KPIs, units, trends, multi-subsidiary comparisons, and operational anomaly detection.
              </p>
            </div>

            {/* 4. Discrepancy Detection */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
                  <Scale size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Discrepancy Detection</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Compare information across sources and identify meaningful variances with mathematical precision.
              </p>
            </div>

            {/* 5. Human Verification */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)' }}>
                  <UserCheck size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Human Verification</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Critical outputs and discrepancies can be reviewed, annotated, and authorized by designated officers before release.
              </p>
            </div>

            {/* 6. Quality Governance */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#F87171' }}>
                  <ShieldAlert size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Quality Governance</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Quality gates can block invalid or unverified report release until citations and checks pass.
              </p>
            </div>

            {/* 7. Provenance & Audit */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA' }}>
                  <Layers size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Provenance & Audit</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Trace information from source document through extraction to final report with immutable audit logs.
              </p>
            </div>

            {/* 8. Government Inquiry */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#F472B6' }}>
                  <Landmark size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Government Inquiry</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Prepare structured evidence-backed parliamentary inquiry responses with official verification safeguards.
              </p>
            </div>
          </div>

          {/* Architectural Stack Card (Mining Truck + Document Sign-off) */}
          <div
            className="card-level-2"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-emerald)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 32,
              alignItems: 'center',
            }}
          >
            {/* Left: Industrial Mining Truck */}
            <div style={{ textAlign: 'center' }}>
              <img
                src="/assets/haul_truck.jpg"
                alt="Industrial Heavy Mining Haul Truck"
                style={{
                  maxWidth: '100%',
                  maxHeight: '260px',
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Right: Statutory Release Document Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary">AGENT 08 QUALITY GATE PASSED</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CIL/CMPDI Statutory Compliance</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
                Auditable Statutory Deliverables with Immutable Provenance
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Every report and parliamentary answer generated by GeoNexus links directly back to original ingested coal production files, drill core logs, and financial tables.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onEnterWorkspace('reports')}
                >
                  <FileCheck size={14} />
                  <span>Inspect Official Reports</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onEnterWorkspace('inquiries')}
                >
                  <Landmark size={14} />
                  <span>Parliamentary Inquiries</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. TRUST / GOVERNANCE VISUAL (Exact Reference Linear Pipeline)
          ========================================================================= */}
      <section
        id="governance-pipeline"
        style={{
          padding: '80px 24px',
          backgroundColor: '#0F131C',
          borderBottom: '1px solid var(--border-hairline)',
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 40 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-primary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              TRUST / GOVERNANCE VISUAL
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#FFFFFF' }}>
              End-to-End Chain of Custody
            </h2>
          </div>

          {/* Linear Pipeline Flow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              padding: '24px 16px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline-alt)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-level-2)',
            }}
          >
            {/* Step 1: Source Document */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)' }}>
                <FileText size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                SOURCE DOCUMENT
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 2: Evidence */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: 'var(--accent-teal)' }}>
                <Search size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                EVIDENCE
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 3: Validation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: 'var(--status-warning)' }}>
                <Scale size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                VALIDATION
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 4: Human Review */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: '#60A5FA' }}>
                <UserCheck size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                HUMAN REVIEW
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 5: Quality Gate */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-emerald)', color: 'var(--accent-primary)' }}>
                <ShieldCheck size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--accent-primary)' }}>
                QUALITY GATE
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 6: Report */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
                <FileCheck size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}>
                REPORT
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PRODUCT IMPACT SECTION (Exact Reference Progression)
          ========================================================================= */}
      <section
        id="impact"
        style={{
          padding: '90px 24px',
          backgroundColor: '#FFFFFF',
          color: '#111827',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 48 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#059669',
                display: 'block',
                marginBottom: 8,
              }}
            >
              PRODUCT IMPACT SECTION
            </span>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.2vw, 38px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#111827',
                maxWidth: '780px',
                margin: '0 auto',
              }}
            >
              From scattered mining reports to traceable operational intelligence.
            </h2>
          </div>

          {/* 6 Progression Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <FileText size={24} style={{ color: '#4B5563' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Operational Intelligence</span>
            </div>

            {/* Card 2 */}
            <div
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Search size={24} style={{ color: '#059669' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Evidence-Grounded</span>
            </div>

            {/* Card 3 */}
            <div
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CheckCircle2 size={24} style={{ color: '#16A34A' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Validated</span>
            </div>

            {/* Card 4 */}
            <div
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Layers size={24} style={{ color: '#4B5563' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Traceable</span>
            </div>

            {/* Card 5 */}
            <div
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <ShieldCheck size={24} style={{ color: '#059669' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Auditable</span>
            </div>

            {/* Card 6 */}
            <div
              style={{
                padding: '20px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <FileCheck size={24} style={{ color: '#16A34A' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Decision-Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FINAL CTA SECTION (Exact Reference Dark Footer Banner)
          ========================================================================= */}
      <section
        style={{
          padding: '90px 24px',
          backgroundColor: '#07090D',
          borderTop: '1px solid var(--border-hairline)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--accent-primary)',
              display: 'block',
              marginBottom: 10,
            }}
          >
            FINAL CTA
          </span>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              marginBottom: 28,
            }}
          >
            Explore the Mining Intelligence Platform
          </h2>

          <button
            className="btn btn-primary btn-lg"
            onClick={() => onEnterWorkspace('dashboard')}
            style={{
              padding: '14px 36px',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 4px 24px rgba(16, 185, 129, 0.4)',
            }}
          >
            EXPLORE PLATFORM
          </button>
        </div>
      </section>
    </div>
  );
};
