import React, { useState } from 'react';
import {
  FileText,
  Search,
  ShieldCheck,
  TrendingUp,
  Scale,
  Sparkles,
  ArrowRight,
  Lock,
  Cpu,
  Layers,
  Users,
  Maximize2,
  X,
  Truck,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { MiningCartTrack } from '@/components/landing/MiningCartTrack';

interface PublicLandingPageProps {
  onExplorePlatform: () => void;
  onRegister: () => void;
  onLogin: () => void;
  onAuthorityAccess?: () => void;
}

interface MiningFleetItem {
  id: string;
  title: string;
  category: 'all' | 'excavation' | 'haulage' | 'drilling' | 'underground' | 'logistics' | 'geology';
  categoryLabel: string;
  categoryBadgeColor: string;
  imageUrl: string;
  subtitle: string;
  description: string;
  specs: { label: string; value: string }[];
  tags: string[];
  operationalRole: string;
  subsidiary: string;
}

const MINING_FLEET_ITEMS: MiningFleetItem[] = [
  {
    id: 'opencast-pit',
    title: 'Massive Opencast Coal Pit & Multi-Bench Vista',
    category: 'excavation',
    categoryLabel: 'Opencast Mine Command',
    categoryBadgeColor: '#34D399',
    imageUrl: '/images/open_surface_mine.jpg',
    subtitle: 'Panoramic Multi-Bench Open Surface Mine with Haul Roads & Shovels',
    description:
      'India’s opencast coal mines produce over 92% of Coal India’s 770+ million tonne annual output. GeoNexus provides an end-to-end mathematical discrepancy engine that cross-validates daily shovel extraction logs, monthly subsidiary reviews, and annual statutory filings.',
    specs: [
      { label: 'Bench Heights', value: '15 – 20 Metres Tiered' },
      { label: 'National Share', value: '92% of India Coal Production' },
      { label: 'Variance Threshold', value: '±2.5% Automated Flagging' },
      { label: 'Subsidiaries', value: 'ECL, BCCL, CCL, WCL, SECL, NCL, MCL' },
    ],
    tags: ['Multi-Bench Tiering', '92% CIL Production', 'Variance Discrepancy Gate', 'All Commands'],
    operationalRole: 'Surface Mine Pit Command & Multi-Bench Synchronization',
    subsidiary: 'All 7 Producing Coal India Subsidiaries',
  },
  {
    id: 'dragline',
    title: 'Electric Walking Dragline Excavator (SAMRAT 2200W Class)',
    category: 'excavation',
    categoryLabel: 'Heavy Overburden Stripping',
    categoryBadgeColor: '#F59E0B',
    imageUrl: '/images/dragline_excavator.jpg',
    subtitle: 'High-Capacity Walking Dragline for Tiered Bench Overburden Removal',
    description:
      'Massive electric walking draglines handle primary overburden removal (OBR) in large Indian opencast coal mines. GeoNexus continuously ingests shift logs, monitors machine cycle times, calculates Stripping Ratios, and audits monthly OBR figures against 3D geological strata seam models.',
    specs: [
      { label: 'Bucket Capacity', value: '33 m³ (Heavy Duty)' },
      { label: 'Boom Length / Radius', value: '180 Metres Working Reach' },
      { label: 'Drive System', value: '2,200 HP Heavy Electric System' },
      { label: 'Telemetry Link', value: 'OBR Volume & Cycle GPS' },
    ],
    tags: ['33m³ Bucket', 'Electric Dragline', 'Stripping Ratio OBR', 'SECL / NCL Deployments'],
    operationalRole: 'Primary Overburden Stripping & Bench Formation',
    subsidiary: 'SECL (Dipka / Gevra), NCL (Nigahi / Jayant)',
  },
  {
    id: 'dump-truck',
    title: '240-Tonne Mega Haul Dump Truck (CAT / Komatsu HD Class)',
    category: 'haulage',
    categoryLabel: 'Heavy Pit Haulage',
    categoryBadgeColor: '#10B981',
    imageUrl: '/images/haul_truck.jpg',
    subtitle: 'Ultra-Class Off-Highway Haulage Dumper for High-Volume Coal Transport',
    description:
      'High-capacity off-highway dumpers transport hundreds of thousands of tonnes of blasted raw coal and overburden daily from pit floor to surface Coal Handling Plants (CHP). GeoNexus matches weighbridge RFID tickets with subsidiary production reports to eliminate payload variance disputes.',
    specs: [
      { label: 'Payload Capacity', value: '240 Metric Tonnes' },
      { label: 'Engine Output', value: '2,500 HP Twin-Turbo Diesel' },
      { label: 'Tire Diameter', value: '4.0 Metres (Rock Lug)' },
      { label: 'Weighbridge Sync', value: 'Automated RFID Dispatch Match' },
    ],
    tags: ['240T Payload', 'Twin-Turbo 2500HP', 'RFID Weighbridge Match', 'BCCL / CCL Pit Fleet'],
    operationalRole: 'Raw Coal Haulage from Pit Face to Silo Incline',
    subsidiary: 'BCCL (Jharia), CCL (North Karanpura), WCL (Nagpur)',
  },
  {
    id: 'blast-drill',
    title: 'High-Precision Rotary Blast-Hole Drilling Rig (DR410i Class)',
    category: 'drilling',
    categoryLabel: 'Bench Blast Exploration',
    categoryBadgeColor: '#60A5FA',
    imageUrl: '/images/blast_drill_rig.jpg',
    subtitle: 'Automated Rotary Drill Rig with Strata Penetration Telemetry',
    description:
      'Rotary blasthole rigs drill high-precision vertical and angled hole patterns across sandstone and shale benches for controlled blasting. Penetration rate and vibration telemetry are cross-referenced in GeoNexus with CMPDI lithology depth charts before explosive charging.',
    specs: [
      { label: 'Hole Diameter', value: '200 – 270 mm' },
      { label: 'Single-Pass Depth', value: 'Up to 45 Metres' },
      { label: 'Dust Control', value: 'High-Pressure Water Mist' },
      { label: 'Strata Telemetry', value: 'Instant Rock Hardness Logging' },
    ],
    tags: ['270mm Hole Dia', 'Single-Pass 45m', 'Strata Hardness Match', 'CMPDI Exploration'],
    operationalRole: 'Pre-Blast Pattern Drilling & Strata Boundary Confirmation',
    subsidiary: 'CMPDI Exploration Fields, SECL, MCL',
  },
  {
    id: 'continuous-miner',
    title: 'Subterranean Continuous Coal Miner & Roadheader (Joy Class)',
    category: 'underground',
    categoryLabel: 'Subterranean Mining',
    categoryBadgeColor: '#A78BFA',
    imageUrl: '/images/continuous_miner.jpg',
    subtitle: 'Underground Seam Extraction Machine Operating in Timbered Caverns',
    description:
      'Continuous miners cut through subterranean coal seams under timber-supported and rock-bolted mine roofs without cyclic drilling and blasting. GeoNexus tracks underground DGMS statutory gas limits (CH4 / CO), ventilation flow rates, and shift extraction logs.',
    specs: [
      { label: 'Cutting Rate', value: '10 – 15 Tonnes / Minute' },
      { label: 'Cutter Head', value: 'Solid Carbide Tipped Drum' },
      { label: 'Safety Telemetry', value: 'Real-Time CH4 / CO Gas Sensors' },
      { label: 'Statutory Gate', value: 'Mandatory DGMS Safety Audit' },
    ],
    tags: ['Carbide Cutting Drum', 'DGMS Methane Sensors', 'Timbered Tunnel Strata', 'ECL / WCL Mines'],
    operationalRole: 'Underground Seam Development & Bord-and-Pillar Depillaring',
    subsidiary: 'ECL (Raniganj), WCL (Pench / Kanhan), BCCL (Moonidih)',
  },
  {
    id: 'chp-rail',
    title: 'Coal Handling Plant (CHP) & Rail Freight Siding',
    category: 'logistics',
    categoryLabel: 'Rail Dispatch & Logistics',
    categoryBadgeColor: '#F472B6',
    imageUrl: '/images/coal_handling_plant.jpg',
    subtitle: 'Automated Rapid Wagon Loading Silo & Freight Train Dispatch',
    description:
      'High-throughput Coal Handling Plants (CHP) crush, screen, and rapidly load 58-wagon BOXN railway rakes in under an hour for delivery to national thermal power stations. GeoNexus correlates dispatch manifests with rake supply quotas to formulate evidence-grounded parliamentary inquiry drafts.',
    specs: [
      { label: 'Loading Capacity', value: '5,000 Tonnes / Hour (Rapid Silo)' },
      { label: 'Train Rake Size', value: '58 BOXN Wagons (3,800T per Rake)' },
      { label: 'Offtake Tracking', value: 'Real-Time Power Utility Allocations' },
      { label: 'Parliamentary QA', value: 'Evidence-Backed Lok Sabha Drafts' },
    ],
    tags: ['5,000 TPH Silo', '58-Wagon Rakes', 'Rail Dispatch Manifest', 'Ministry QA Ready'],
    operationalRole: 'Coal Crushing, Grading & Rapid Rail Freight Loading',
    subsidiary: 'MCL (Talcher / Ib Valley), SECL (Korba), NCL (Singrauli)',
  },
  {
    id: 'geological-core',
    title: 'CMPDI Geological Core Sample Trays & Borehole Lithology',
    category: 'geology',
    categoryLabel: 'Geological Stratigraphy Lab',
    categoryBadgeColor: '#38BDF8',
    imageUrl: '/images/geological_core_drilling.jpg',
    subtitle: 'Sub-Surface Exploration Core Logging & Indian Coal GCV Grading (G1–G17)',
    description:
      'CMPDI exploration core trays capture physical strata depth, seam thickness, moisture, and ash content % for accurate Indian coal grade classification (G1 to G17). GeoNexus automatically ingests scanned borehole PDF tables, performs PyMuPDF & OCR extraction, and binds evidence citations.',
    specs: [
      { label: 'Classification', value: 'Indian Coal GCV Grades G1 to G17' },
      { label: 'Lithology Parsing', value: 'Borehole Stratigraphy & Seam Depth' },
      { label: 'Extraction Pipeline', value: 'PyMuPDF + Tesseract OCR + SHA-256' },
      { label: 'Authority Institute', value: 'CMPDI Ranchi & Regional Institutes' },
    ],
    tags: ['G1–G17 GCV Banding', 'Core Tray Logging', 'Lithology OCR Matrix', 'CMPDI Ranchi'],
    operationalRole: 'Exploration Borehole Logging & Reserve Estimation',
    subsidiary: 'CMPDI HQ Ranchi & Regional Institutes (RI-I to RI-VII)',
  },
];

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onExplorePlatform,
  onRegister,
  onLogin,
  onAuthorityAccess,
}) => {
  const [selectedFleetFilter, setSelectedFleetFilter] = useState<
    'all' | 'excavation' | 'haulage' | 'drilling' | 'underground' | 'logistics' | 'geology'
  >('all');
  const [lightboxVehicle, setLightboxVehicle] = useState<MiningFleetItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredFleet =
    selectedFleetFilter === 'all'
      ? MINING_FLEET_ITEMS
      : MINING_FLEET_ITEMS.filter((item) => item.category === selectedFleetFilter);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#070A0F',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* 1. PUBLIC STICKY HEADER */}
      <header
        style={{
          height: '70px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(7, 10, 15, 0.94)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Brand & Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <MiningLogo size={32} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              GeoNexus
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              CMPDI • Coal India Limited
            </span>
          </div>
        </div>

        {/* Navigation Anchors (Desktop) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
          }}
          className="desktop-nav"
        >
          <a
            href="#pipeline"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('pipeline');
            }}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Pipeline Track
          </a>
          <a
            href="#mining-fleet"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('mining-fleet');
            }}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Mining Fleet & HEMM
          </a>
          <a
            href="#capabilities"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('capabilities');
            }}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Capabilities
          </a>
          <a
            href="#agents"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('agents');
            }}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            8-Agent DAG
          </a>
          <a
            href="#tech-stack"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('tech-stack');
            }}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Technology
          </a>
          <a
            href="#governance"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('governance');
            }}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Governance
          </a>
        </nav>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLogin}
            style={{ display: 'flex', alignItems: 'center', gap: 5, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Lock size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Login</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onRegister}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
          >
            <span>Register</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onAuthorityAccess || onLogin}
            title="Authority RBAC Portal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              borderColor: 'var(--border-emerald)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
            }}
          >
            <Users size={13} style={{ color: 'var(--text-emerald)' }} />
            <span style={{ color: 'var(--text-emerald)' }}>Authority</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 'var(--radius-sm)',
              color: '#FFFFFF',
              padding: '6px',
              cursor: 'pointer',
            }}
            className="mobile-nav-toggle-btn"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'rgba(11, 14, 20, 0.98)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            zIndex: 49,
            position: 'sticky',
            top: 70,
            backdropFilter: 'blur(20px)',
          }}
        >
          {['pipeline', 'mining-fleet', 'capabilities', 'agents', 'tech-stack', 'governance'].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection(sec);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'left',
                padding: '8px 0',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                textTransform: 'capitalize',
              }}
            >
              {sec.replace('-', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* 2. HERO SECTION WITH CINEMATIC OPEN SURFACE MINE BACKGROUND */}
      <section
        style={{
          position: 'relative',
          padding: '80px 20px 64px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          backgroundImage: `
            linear-gradient(180deg, rgba(7, 10, 15, 0.88) 0%, rgba(11, 16, 26, 0.78) 42%, rgba(7, 10, 15, 0.98) 100%),
            url("/images/open_surface_mine.jpg")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center 18%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Cavern Aura Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(ellipse at 50% 30%, rgba(16, 185, 129, 0.18) 0%, transparent 65%),
              radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.12) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Hackathon Context Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 20px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            color: 'var(--text-emerald)',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: 24,
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Sparkles size={14} />
          <span>Smart India Hackathon 2026 • Problem Statement SIH26023 • Ministry of Coal / CIL</span>
        </div>

        {/* Main Brand Title */}
        <h1
          style={{
            fontSize: 'clamp(44px, 6.8vw, 80px)',
            fontWeight: 950,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            color: '#FFFFFF',
            maxWidth: '1000px',
            marginBottom: 16,
            textShadow: '0 4px 35px rgba(0, 0, 0, 0.95), 0 0 25px rgba(16, 185, 129, 0.25)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          GeoNexus
        </h1>

        {/* Subtitle */}
        <h2
          style={{
            fontSize: 'clamp(20px, 3.2vw, 34px)',
            fontWeight: 800,
            color: '#34D399',
            marginBottom: 20,
            letterSpacing: '-0.015em',
            textShadow: '0 2px 16px rgba(0, 0, 0, 0.9)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          AI-Powered Geological, Mining & Reporting Platform
        </h2>

        {/* Concise Platform Summary */}
        <p
          style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            lineHeight: 1.68,
            color: '#E2E8F0',
            maxWidth: '920px',
            marginBottom: 30,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          Designed for AI-assisted processing of geological, mining and production information across CMPDI and Coal India subsidiaries (ECL, BCCL, CCL, WCL, SECL, NCL, MCL).
          Transforms physical borehole logs, heavy earth-moving telemetry, and monthly operational filings into cross-validated mathematical data, verified DGMS compliance, and evidence-grounded reports.
        </p>

        {/* Operational Problem Statement & GeoNexus Approach Callout */}
        <div
          style={{
            maxWidth: '980px',
            width: '100%',
            marginBottom: 36,
            padding: '20px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            position: 'relative',
            zIndex: 2,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--status-warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                The Operational Challenge
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Mining and reporting information exists across scanned PDFs, digital documents, spreadsheets, images, and historical archives — creating manual compilation bottlenecks, delayed reporting, inconsistent figures, difficult historical retrieval, and limited traceability.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                The GeoNexus Solution Pipeline
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {['Ingest', 'Extract', 'Retrieve', 'Validate', 'Govern', 'Report'].map((step, idx) => (
                  <React.Fragment key={step}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#A7F3D0',
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {step}
                    </span>
                    {idx < 5 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
                Evidence-grounded response gating ensures unsupported claims never proceed to statutory deliverables.
              </p>
            </div>
          </div>
        </div>

        {/* Dual Primary Call to Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 44,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onExplorePlatform || onRegister}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 36px',
              fontSize: 16,
              fontWeight: 800,
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span>Access GeoNexus (Register)</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={onLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 800,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Lock size={17} style={{ color: 'var(--accent-primary)' }} />
            <span>Sign In / Login</span>
          </button>
        </div>

        {/* Live Architectural Metrics Strip matching Overview page */}
        <div
          style={{
            maxWidth: '1200px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            padding: '18px 24px',
            backgroundColor: 'rgba(13, 18, 28, 0.90)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              8 Agents
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Autonomous DAG
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>
              Hybrid RRF
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Lexical + Vector Retrieval
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
              G1–G17
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Coal GCV Grading
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-emerald)', fontFamily: 'var(--font-mono)' }}>
              Evidence Gating
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Grounded Output Control
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--status-warning)', fontFamily: 'var(--font-mono)' }}>
              Cross-Doc Audit
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Mathematical Variance
            </div>
          </div>
        </div>
      </section>

      {/* 3. ANIMATED MINING CART PIPELINE SECTION (DUNGEON / UNDERGROUND TUNNEL ENVIRONMENT) */}
      <section
        id="pipeline"
        style={{
          padding: '52px 24px 68px',
          maxWidth: '1260px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <MiningCartTrack />
      </section>

      {/* 3.5 HEAVY MINING MACHINERY & OPERATIONAL FLEET SHOWCASE */}
      <section
        id="mining-fleet"
        style={{
          padding: '76px 24px',
          backgroundColor: '#080C14',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: '1260px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)', marginBottom: 8 }}>
              <Truck size={16} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}
              >
                HEAVY MINING MACHINERY & FLEET TELEMETRY
              </span>
            </div>
            <h3 style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
              Real Opencast & Underground Heavy Mining Fleet
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: '780px', margin: '0 auto' }}>
              GeoNexus bridges the gap between massive physical HEMM machinery, CMPDI geological core laboratories, and automated railway freight dispatching across all Coal India subsidiaries.
            </p>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 26,
              }}
            >
              {[
                { id: 'all', label: 'All Equipment & Facilities' },
                { id: 'excavation', label: 'Heavy Draglines & Pits' },
                { id: 'haulage', label: '240T Mega Dumpers' },
                { id: 'drilling', label: 'Rotary Blast Drills' },
                { id: 'underground', label: 'Subterranean Miners' },
                { id: 'logistics', label: 'Rail CHP Silos' },
                { id: 'geology', label: 'CMPDI Core Labs' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedFleetFilter(cat.id as any)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: selectedFleetFilter === cat.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
                    color: selectedFleetFilter === cat.id ? '#FFFFFF' : 'var(--text-secondary)',
                    border: selectedFleetFilter === cat.id ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mining Fleet Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
            }}
          >
            {filteredFleet.map((item) => (
              <div
                key={item.id}
                className="card-level-1"
                style={{
                  backgroundColor: 'rgba(14, 19, 29, 0.95)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                }}
              >
                {/* Photo Header with Category Badge and Expand Button */}
                <div style={{ position: 'relative', height: '230px', overflow: 'hidden', backgroundColor: '#000000' }}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.5s ease',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/images/opencast_coal_mine.jpg';
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                  />

                  {/* Top Category Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(0, 0, 0, 0.82)',
                      border: `1px solid ${item.categoryBadgeColor}`,
                      color: item.categoryBadgeColor,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {item.categoryLabel}
                  </div>

                  {/* Expand Lightbox Button */}
                  <button
                    type="button"
                    onClick={() => setLightboxVehicle(item)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                    }}
                    title="View High-Resolution Image"
                  >
                    <Maximize2 size={11} /> Expand
                  </button>
                </div>

                {/* Card Content Area */}
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, lineHeight: 1.3 }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 12 }}>
                    {item.subtitle}
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                    {item.description}
                  </p>

                  {/* Technical Specs 2x2 Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      padding: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      marginBottom: 16,
                    }}
                  >
                    {item.specs.map((spec, sidx) => (
                      <div key={sidx} style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {spec.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#E2E8F0' }}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Deployment Tags */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE CAPABILITIES (9 Master Architectural Pillars) */}
      <section
        id="capabilities"
        style={{
          padding: '76px 24px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-hairline)',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
              DOMAIN ARCHITECTURE
            </span>
            <h3 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Engineered for Mining Precision & Statutory Rigor
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: '720px', margin: '8px auto 0' }}>
              Built from first principles to address operational reporting bottlenecks and data fragmentation across Coal India subsidiary commands.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 20,
            }}
          >
            {/* 1. Adaptive Document Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(20, 184, 166, 0.14)', color: 'var(--accent-teal)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Adaptive Document Intelligence</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-Format Parsing & OCR</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Processes digital and scanned documents using document extraction, OCR, preprocessing and document-quality assessment. Combines PyMuPDF layout parsing with adaptive Tesseract OCR and SHA-256 integrity checksums.
              </p>
              <div style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 600 }}>
                ✓ Table matrix extraction • Adaptive PSM 3/6 • SHA-256 fingerprinting
              </div>
            </div>

            {/* 2. Mining Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#60A5FA' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Mining Intelligence</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Domain Extraction & Normalization</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Extracts structured mining information and normalizes supported units (MT, Tonnes, Lakh Te, MCuM), reporting periods, and domain measurements including stripping ratios and Indian G1–G17 GCV grade classification.
              </p>
              <div style={{ fontSize: 11, color: '#60A5FA', fontWeight: 600 }}>
                ✓ G1–G17 GCV banding • Stripping ratio (OBR/Coal) • Unit normalization
              </div>
            </div>

            {/* 3. Evidence-Centered Retrieval */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.14)', color: 'var(--accent-primary)' }}>
                  <Search size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Evidence-Centered Retrieval</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hybrid Evidence Search</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Finds relevant source material while suppressing duplicate or weak evidence and preserving source context. Uses Reciprocal Rank Fusion (RRF) across lexical and vector indices with OCR-quality awareness.
              </p>
              <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>
                ✓ Reciprocal Rank Fusion • Duplicate suppression • Page-level evidence
              </div>
            </div>

            {/* 4. 8-Agent Intelligence Workflow */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.14)', color: '#A78BFA' }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>8-Agent Intelligence Workflow</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>DAG Orchestration</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Coordinates document processing, retrieval, mining intelligence, validation, reporting, inquiry handling and quality governance through eight specialized agents in an orchestrated DAG.
              </p>
              <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>
                ✓ Dependency-aware execution • Bounded concurrency • Stateful checkpoints
              </div>
            </div>

            {/* 5. Cross-Document Validation */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.14)', color: 'var(--status-warning)' }}>
                  <Scale size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Cross-Document Validation</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mathematical Discrepancy Engine</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Compares normalized information across documents and identifies discrepancies, contradictions and data-quality issues with deterministic variance calculations and direction of difference.
              </p>
              <div style={{ fontSize: 11, color: 'var(--status-warning)', fontWeight: 600 }}>
                ✓ Deterministic variance % • Direction of variance • Discrepancy lifecycle
              </div>
            </div>

            {/* 6. Quality Governance */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.18)', color: 'var(--text-emerald)' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Quality Governance</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Deterministic Release Gates</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Applies deterministic quality gates (PASS, WARNING, REQUIRES_HUMAN_REVIEW, REJECT) before important outputs proceed, enforcing evidence sufficiency gating.
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-emerald)', fontWeight: 600 }}>
                ✓ 4-State release verdicts • Citation density checks • Statutory watermarking
              </div>
            </div>

            {/* 7. Human-in-the-Loop Governance */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.14)', color: '#F87171' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Human-in-the-Loop Governance</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stateful Review Flow</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Routes critical discrepancies, insufficient evidence and sensitive workflows for human review with stateful PAUSE → REVIEW → APPROVE / REJECT / REQUEST REVISION → RESUME controls.
              </p>
              <div style={{ fontSize: 11, color: '#F87171', fontWeight: 600 }}>
                ✓ Pause/Resume checkpoints • Discrepancy override • Reviewer attribution
              </div>
            </div>

            {/* 8. Evidence & Provenance */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.14)', color: '#A78BFA' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Evidence & Provenance</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>End-to-End Traceability</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Maintains traceability from source document and page through extraction, evidence, validation and generated output with tamper-evident audit logs.
              </p>
              <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>
                ✓ Source document links • Page citations • Cryptographic audit ledger
              </div>
            </div>

            {/* 9. Resilient AI Gateway */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(249, 115, 22, 0.14)', color: '#FB923C' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Resilient AI Gateway</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-Tier Provider Chain</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Uses the configured AI provider chain (Gemini → OpenAI-compatible provider → deterministic fallback) with safe fallback behavior that does not generate unsupported LLM-derived claims.
              </p>
              <div style={{ fontSize: 11, color: '#FB923C', fontWeight: 600 }}>
                ✓ Grounded fallback engine • Latency tracking • Graceful degradation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 SIH26023 ALIGNMENT SECTION */}
      <section
        id="sih-alignment"
        style={{
          padding: '64px 24px',
          backgroundColor: '#0A0E17',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
              HACKATHON SPECIFICATION ALIGNMENT
            </span>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Smart India Hackathon 2026 • Problem Statement SIH26023
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: '780px', margin: '8px auto 0' }}>
              Direct mapping of Ministry of Coal / Coal India Limited / CMPDI problem statement requirements to verified GeoNexus backend and agent capabilities.
            </p>
          </div>

          <div
            className="card-level-1"
            style={{
              backgroundColor: 'rgba(14, 19, 29, 0.95)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>SIH26023 Requirement</th>
                    <th style={{ width: '38%' }}>GeoNexus Verified Platform Capability</th>
                    <th style={{ width: '30%' }}>Operational Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>Document Processing</td>
                    <td style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Document Intelligence + Adaptive OCR</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ingestion of digital & scanned PDFs, tables, and geological logs with SHA-256 hashes</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>Validation & Discrepancy Detection</td>
                    <td style={{ color: 'var(--status-warning)', fontWeight: 600 }}>Cross-Document Validation</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mathematical cross-comparison across reports with automated variance calculations</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>Traceability & Provenance</td>
                    <td style={{ color: '#A78BFA', fontWeight: 600 }}>Evidence + Provenance Engine</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>End-to-end citation binding from source page coordinates to final report paragraphs</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>Automated Reports</td>
                    <td style={{ color: '#F472B6', fontWeight: 600 }}>Report Generation Agent</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Evidence-backed DGMS & operational briefs with mandatory draft watermarks</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>Word Cloud & Topic Identification</td>
                    <td style={{ color: '#60A5FA', fontWeight: 600 }}>Topic & Reporting Intelligence</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Automated term extraction and recurring reporting topic discovery across archives</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>AI Query & Interactive Q&A</td>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Retrieval + Evidence + AI Gateway</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Evidence-grounded response gating preventing unsupported LLM assertions</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>High-Priority Ministry Inquiries</td>
                    <td style={{ color: '#FB923C', fontWeight: 600 }}>Government Inquiry Agent</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Parliamentary QA drafts (Lok Sabha/Rajya Sabha) prepared for officer sign-off</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>Human Governance & Release Control</td>
                    <td style={{ color: 'var(--text-emerald)', fontWeight: 600 }}>HITL + Quality Governance</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stateful pause/resume workflow with deterministic PASS/WARNING/REJECT release gates</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 8-AGENT ARCHITECTURE SECTION */}
      <section
        id="agents"
        style={{
          padding: '72px 24px',
          maxWidth: '1220px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
            MULTI-AGENT ORCHESTRATION
          </span>
          <h3 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            The 8 Autonomous Specialized Agents
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: '700px', margin: '8px auto 0' }}>
            Each agent operates as an independent micro-worker within a directed acyclic graph (DAG), orchestrated by the Manager Agent with strict execution contracts.
          </p>
        </div>

        {/* 8 Agents Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {/* Agent 1 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}>01. Manager / Orchestrator</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.18)', color: 'var(--text-emerald)', fontWeight: 700 }}>ORCHESTRATOR</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ManagerAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Coordinates dependency-aware execution, retries, timeouts, bounded concurrency, and workflow state across all agents.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              DAG_PLANNING • RETRY_BACKOFF • CHECKPOINTS
            </div>
          </div>

          {/* Agent 2 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--accent-teal)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-teal)', fontWeight: 700 }}>02. Document Intelligence</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(20, 184, 166, 0.18)', color: 'var(--accent-teal)', fontWeight: 700 }}>EXTRACTION</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>DocumentIntelligenceAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Handles document extraction, adaptive OCR, preprocessing, table matrix parsing, and document-quality evaluation.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              ADAPTIVE_OCR • TABLE_PARSER • PROVENANCE
            </div>
          </div>

          {/* Agent 3 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #60A5FA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60A5FA', fontWeight: 700 }}>03. Retrieval / RAG</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#60A5FA', fontWeight: 700 }}>HYBRID RRF</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>RetrievalAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Retrieves relevant evidence using lexical/vector similarity with Reciprocal Rank Fusion, applying evidence-sufficiency controls.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              HYBRID_RETRIEVAL • RRF_FUSION • SUFFICIENCY_GATE
            </div>
          </div>

          {/* Agent 4 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #A78BFA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#A78BFA', fontWeight: 700 }}>04. Mining Intelligence</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(139, 92, 246, 0.18)', color: '#A78BFA', fontWeight: 700 }}>DOMAIN MATH</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>MiningIntelligenceAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Extracts and normalizes supported mining-specific measurements: coal grades (G1–G17), seams, OBR, stripping ratios, and units.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              GCV_CLASSIFICATION • OBR_MATH • UNIT_NORMALIZER
            </div>
          </div>

          {/* Agent 5 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--status-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--status-warning)', fontWeight: 700 }}>05. Validation</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(245, 158, 11, 0.18)', color: 'var(--status-warning)', fontWeight: 700 }}>VARIANCE ENGINE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ValidationAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Detects discrepancies, contradictions and data-quality problems across documents with normalized variance scoring.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              CROSS_DOC_AUDIT • VARIANCE_CALC • SEVERITY_LOG
            </div>
          </div>

          {/* Agent 6 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #F472B6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F472B6', fontWeight: 700 }}>06. Report Generation</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(236, 72, 153, 0.18)', color: '#F472B6', fontWeight: 700 }}>SYNTHESIS</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ReportGenerationAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Produces evidence-backed statutory reports and executive summaries from validated workflow outputs with draft safety watermarks.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              DGMS_TEMPLATES • REPORT_BUILDER • DRAFT_WATERMARK
            </div>
          </div>

          {/* Agent 7 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #FB923C' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FB923C', fontWeight: 700 }}>07. Government Inquiry</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(249, 115, 22, 0.18)', color: '#FB923C', fontWeight: 700 }}>PARLIAMENT QA</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>GovernmentInquiryAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Supports evidence-based drafting for high-priority and parliamentary-style inquiries (Lok Sabha / Rajya Sabha) for officer review.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              MINISTRY_QA • PARLIAMENT_DRAFTER • CITATION_BINDING
            </div>
          </div>

          {/* Agent 8 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--text-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-emerald)', fontWeight: 700 }}>08. Quality Governance</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.22)', color: 'var(--text-emerald)', fontWeight: 700 }}>GATEKEEPER</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>QualityGovernanceAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Evaluates output quality, evidence sufficiency, and statutory compliance, deciding whether results can proceed or require review.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              RELEASE_GATE • PASS_WARNING_REJECT • GROUNDING_GATE
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED TECHNOLOGY STACK SECTION */}
      <section
        id="tech-stack"
        style={{
          padding: '72px 24px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-hairline)',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
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
              VERIFIED ENGINEERING STACK
            </span>
            <h3 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>
              Built with Modern, Production-Ready Technologies
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0' }}>
              Every layer of the GeoNexus tech stack is benchmarked against real CMPDI geological and mining document loads.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 18,
            }}
          >
            <div style={{ padding: '22px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 6 }}>FRONTEND SPA</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>React 18 + Vite + TS</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Vanilla CSS design tokens, Lucide icons, live DAG graph visualization, zero-framework lightweight overhead.
              </p>
            </div>

            <div style={{ padding: '22px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>BACKEND API</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Python 3.11 + Flask</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Modular blueprint architecture, SQLite3 / PostgreSQL persistence, SSE streaming, and sub-second endpoint response.
              </p>
            </div>

            <div style={{ padding: '22px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', marginBottom: 6 }}>SEARCH ENGINE</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Hybrid Evidence Retrieval</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Lexical TF-IDF + full-text search fused via Reciprocal Rank Fusion (RRF), OCR quality weighting, and duplicate suppression.
              </p>
            </div>

            <div style={{ padding: '22px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', marginBottom: 6 }}>AI ENGINE</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Resilient Multi-Tier Gateway</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Gemini → OpenAI-compatible provider → Grounded deterministic fallback that does not generate unsupported claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. GOVERNANCE & ACCESS CONTROL SECTION */}
      <section
        id="governance"
        style={{
          padding: '72px 24px 88px',
          maxWidth: '1220px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            padding: '44px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-emerald)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              SECURITY & COMPLIANCE
            </span>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 14px' }}>
              Role-Based Access Control & Audit Trails
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Engineered specifically for Coal India hierarchical commands. The backend serves as the single source of truth for authorization — all endpoints verify role permissions server-side.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Strict 4-Tier Server-Side RBAC (Viewer, Analyst, Officer, Admin)',
                'Cryptographic SHA-256 document hashing & tamper detection',
                'Deterministic PASS / WARNING / REQUIRES_HUMAN_REVIEW / REJECT release gates',
                'Complete provenance ledger of all agent DAG handoffs and review decisions',
              ].map((point, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Access Tier Badges */}
          <div style={{ padding: '26px', backgroundColor: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              Server-Enforced Access Tiers
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Auditor / Viewer</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Public Registrations</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-emerald)', fontWeight: 600 }}>Read-Only & Search</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Mining Analyst</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CIL / CMPDI Operations</div>
                </div>
                <span style={{ fontSize: 11, color: '#60A5FA', fontWeight: 600 }}>Upload & DAG Tasks</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Reviewing Officer</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ministry / Joint Secretary</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--status-warning)', fontWeight: 600 }}>Sign-Off & Approvals</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>System Admin</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Platform Administration</div>
                </div>
                <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>Full System Control</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PUBLIC FOOTER */}
      <footer
        style={{
          padding: '36px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          backgroundColor: '#05070B',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 12,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MiningLogo size={24} />
          <div>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>GeoNexus</span> • Smart India Hackathon 2026 (SIH26023)
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Ministry of Coal • Coal India Limited • CMPDI</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRegister}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Register
          </button>
          <button
            type="button"
            onClick={onLogin}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={onLogin}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
          >
            Access GeoNexus Portal →
          </button>
        </div>
      </footer>

      {/* 9. HIGH-RESOLUTION VEHICLE & MACHINERY LIGHTBOX MODAL */}
      {lightboxVehicle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxVehicle(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '1080px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0D121C',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#131A26',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: `1px solid ${lightboxVehicle.categoryBadgeColor}`,
                    color: lightboxVehicle.categoryBadgeColor,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {lightboxVehicle.categoryLabel}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  {lightboxVehicle.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxVehicle(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* High-Res Photo Container */}
            <div style={{ flex: 1, maxHeight: '60vh', overflow: 'hidden', backgroundColor: '#000000', position: 'relative' }}>
              <img
                src={lightboxVehicle.imageUrl}
                alt={lightboxVehicle.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>

            {/* Modal Info Footer */}
            <div style={{ padding: '20px 24px', backgroundColor: '#0A0E17', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.6, marginBottom: 14 }}>
                {lightboxVehicle.description}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {lightboxVehicle.specs.map((spec, sidx) => (
                  <div key={sidx}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{spec.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLandingPage;
