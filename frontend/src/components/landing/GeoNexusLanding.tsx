import React, { useState, useEffect } from 'react';
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
  Activity,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { RoleSwitcher } from '@/components/ui/RoleSwitcher';
import { NavigationTab } from '@/components/layout/Sidebar';
import { MiningCartTrack } from '@/components/landing/MiningCartTrack';
import { settingsService } from '@/services/api';
import { SystemHealth } from '@/types';

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
  const [liveHealth, setLiveHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    let isMounted = true;
    settingsService
      .getHealth()
      .then((res) => {
        if (isMounted && res) {
          setLiveHealth(res);
        }
      })
      .catch(() => {
        // Fallback gracefully to props
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isHealthy = liveHealth ? liveHealth.status === 'healthy' : aiProviderOnline;
  const healthBadge = liveHealth ? liveHealth.status.toUpperCase() : (aiProviderOnline ? 'HEALTHY' : 'DEGRADED');
  const dbBackend = (typeof liveHealth?.database === 'object' && liveHealth.database?.backend) || 'sqlite';
  const ocrReady = liveHealth?.ocr_engine?.tesseract_primary_available !== false;
  const currentProvider = liveHealth?.active_ai_info?.provider_name || aiProviderName;

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
          backgroundImage: 'linear-gradient(to bottom, rgba(7, 10, 15, 0.82) 0%, rgba(11, 16, 26, 0.62) 42%, rgba(7, 10, 15, 0.98) 100%), url("/images/open_surface_mine.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
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
            <RoleSwitcher compact />

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
            padding: '70px 24px 50px',
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
              marginBottom: 20,
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
            }}
          >
            <Sparkles size={14} />
            <span>Autonomous 8-Agent Mining & Geological Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: 'clamp(34px, 5.2vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              maxWidth: '960px',
              marginBottom: 16,
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
            }}
          >
            Mining Intelligence, Grounded in Evidence.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              lineHeight: 1.6,
              color: '#D1D5DB',
              maxWidth: '820px',
              marginBottom: 24,
              fontWeight: 400,
            }}
          >
            Transform geological and mining reports into validated, traceable intelligence through an orchestrated 8-agent AI platform with evidence-grounded response gating.
          </p>

          {/* 10-Step End-to-End Pipeline Narrative Strip */}
          <div
            style={{
              maxWidth: '1040px',
              width: '100%',
              marginBottom: 32,
              padding: '14px 20px',
              backgroundColor: 'rgba(13, 18, 28, 0.88)',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              End-to-End Intelligence Pipeline
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                flexWrap: 'wrap',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              {[
                'Documents',
                'OCR / Extraction',
                'Mining Intelligence',
                'Hybrid Retrieval',
                'Evidence',
                '8-Agent DAG',
                'Validation',
                'Quality Governance',
                'Human Review',
                'Report / Inquiry',
              ].map((step, idx) => (
                <React.Fragment key={step}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: idx === 5 ? 'var(--accent-primary)' : idx === 7 ? 'var(--text-emerald)' : '#E2E8F0',
                    }}
                  >
                    {step}
                  </span>
                  {idx < 9 && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

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

          {/* Live Dynamic Telemetry Strip connected to real backend */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '10px 22px',
              backgroundColor: 'rgba(11, 14, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(8px)',
              fontSize: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className={isHealthy ? 'status-dot status-dot-success' : 'status-dot status-dot-warning'} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>System: {healthBadge}</span>
            </div>
            <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Database size={13} style={{ color: 'var(--accent-teal)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                DB: {dbBackend.toUpperCase()} ({docCount} Docs)
              </span>
            </div>
            <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Activity size={13} style={{ color: ocrReady ? 'var(--text-emerald)' : 'var(--status-warning)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                OCR: {ocrReady ? 'Tesseract Primary' : 'Fallback Mode'}
              </span>
            </div>
            {conflictsCount > 0 && (
              <>
                <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertTriangle size={13} style={{ color: 'var(--status-warning)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {conflictsCount} Discrepancies
                  </span>
                </div>
              </>
            )}
            <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Cpu size={13} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{currentProvider}</span>
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
          2. MINE-CART VISUAL & SUBTERRANEAN INTELLIGENCE PIPELINE
          ========================================================================= */}
      <section
        id="mine-cart-section"
        style={{
          position: 'relative',
          padding: '60px 24px 70px',
          backgroundColor: '#0A0E17',
          borderBottom: '1px solid var(--border-hairline)',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <MiningCartTrack />
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
                  Coordinates workflow DAG, retries, and bounded execution
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Dynamically constructs task DAGs, checks for cycles, tracks dependencies, triggers parallel sub-tasks, and handles bounded retries with persistent checkpoints.
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
                  Handles document extraction, adaptive OCR, and document quality
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Processes PDF, DOCX, CSV, XLSX, and scanned images via Tesseract (adaptive PSM 3/6) and RapidOCR fallback, with SHA-256 fingerprinting and document classification.
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
                    03 — Retrieval / RAG
                  </span>
                  <span className="badge badge-slate">Hybrid RRF</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Retrieves evidence and enforces evidence-sufficiency controls
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Executes hybrid lexical and vector search with Reciprocal Rank Fusion, OCR-quality weighting, duplicate suppression, and strict page citations.
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
                  Extracts and normalizes supported mining-specific measurements
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Performs coal metric normalization (MT, Tonnes, Lakh Te, MCuM), stripping ratio calculations (OBR/Coal), G1–G17 GCV grade classification, and physical plausibility sanity checks.
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
                    05 — Validation
                  </span>
                  <span className="badge badge-warning">Cross-Check</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Detects discrepancies, contradictions, and data-quality issues
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Performs cross-document comparison, computing normalized variance %, direction of difference, severity levels, and discrepancy lifecycle management.
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
                  Produces evidence-backed reports with mandatory draft watermarks
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Compiles standardized statutory reports, executive briefings, and automated exports in PDF and DOCX formats with mandatory human verification draft wording.
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
                  Supports evidence-based drafting for high-priority inquiries
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Drafts parliamentary Lok Sabha/Rajya Sabha responses and Ministry replies with mandatory officer sign-off checkpoints before release.
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
                    08 — Quality Governance
                  </span>
                  <span className="badge badge-primary">Quality Gate</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Evaluates output quality, evidence sufficiency, and release readiness
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Enforces deterministic release gates (PASS, WARNING, REQUIRES_HUMAN_REVIEW, REJECT), ensuring unsupported claims are halted.
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
              Mining intelligence and multi-agent governance engineered for Coal India & CMPDI operations.
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
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Adaptive Document Intelligence</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Processes digital and scanned documents using PyMuPDF, adaptive Tesseract OCR (PSM 3/6), and SHA-256 fingerprinting.
              </p>
            </div>

            {/* 2. Evidence-Grounded Retrieval */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)' }}>
                  <Search size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Hybrid Evidence Retrieval</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Evidence-first retrieval fusing lexical/vector similarity with Reciprocal Rank Fusion, duplicate suppression, and page citations.
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
                Extracts and normalizes production (MT), OBR (MCuM), stripping ratios, and standard Indian G1–G17 GCV grades.
              </p>
            </div>

            {/* 4. Cross-Document Validation */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
                  <Scale size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Cross-Document Validation</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Compares normalized information across documents, calculating variance %, direction of difference, and discrepancy lifecycle.
              </p>
            </div>

            {/* 5. Human Verification */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)' }}>
                  <UserCheck size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Human-in-the-Loop Review</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Stateful PAUSE → REVIEW → APPROVE / REJECT / REQUEST REVISION → RESUME controls for critical discrepancies and sensitive reports.
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
                Deterministic release gates (PASS, WARNING, REQUIRES_HUMAN_REVIEW, REJECT) enforcing evidence sufficiency gating.
              </p>
            </div>

            {/* 7. Provenance & Audit */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA' }}>
                  <Layers size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>End-to-End Provenance</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Trace information from source document through extraction, evidence, and validation to final deliverable with immutable logs.
              </p>
            </div>

            {/* 8. Topic Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#F472B6' }}>
                  <Landmark size={18} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Topic & Reporting Intelligence</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Identifies recurring terminology and reporting topics across processed geological records and statutory archives.
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
                <span className="badge badge-primary">AGENT 08 QUALITY GATE VERIFIED</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CIL/CMPDI Statutory Compliance</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
                Auditable Statutory Deliverables with Immutable Provenance
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Every report and parliamentary draft generated by GeoNexus links directly back to original ingested coal production files, drill core logs, and financial tables.
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
              End-to-End Chain of Custody & Evidence Lineage
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

            {/* Step 2: Extraction & OCR */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: 'var(--accent-teal)' }}>
                <Search size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                EXTRACTION / OCR
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 3: Retrieval & Evidence */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: '#60A5FA' }}>
                <Layers size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                EVIDENCE
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 4: Validation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: 'var(--status-warning)' }}>
                <Scale size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                VALIDATION
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

            {/* Step 6: Human Review */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-hairline)', color: '#F87171' }}>
                <UserCheck size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                HUMAN REVIEW
              </span>
            </div>

            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />

            {/* Step 7: Report Deliverable */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: '120px' }}>
              <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
                <FileCheck size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}>
                REPORT / INQUIRY
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
