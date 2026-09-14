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
  FileCheck2,
  HelpCircle,
  Layers,
  Users,
  Maximize2,
  X,
  Truck,
  CheckCircle2,
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
          padding: '0 32px',
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
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <MiningLogo size={34} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              GeoNexus
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              CMPDI • Coal India Limited Intelligence Suite
            </span>
          </div>
        </div>

        {/* Navigation Anchors (Desktop) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 26,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLogin}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Lock size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Login</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onRegister}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <span>Register / Access</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onAuthorityAccess || onLogin}
            title="Authority RBAC Portal"
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--border-emerald)' }}
          >
            <Users size={13} style={{ color: 'var(--text-emerald)' }} />
            <span>Authority Portal</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION WITH CINEMATIC OPEN SURFACE MINE BACKGROUND */}
      <section
        style={{
          position: 'relative',
          padding: '96px 24px 72px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          backgroundImage: `
            linear-gradient(180deg, rgba(7, 10, 15, 0.82) 0%, rgba(11, 16, 26, 0.62) 45%, rgba(7, 10, 15, 0.98) 100%),
            url("/images/open_surface_mine.jpg")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
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
            marginBottom: 24,
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
            fontSize: 'clamp(15px, 1.8vw, 19px)',
            lineHeight: 1.68,
            color: '#E2E8F0',
            maxWidth: '880px',
            marginBottom: 38,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          An autonomous multi-agent intelligence suite built for CMPDI and Coal India subsidiaries (ECL, BCCL, CCL, WCL, SECL, NCL, MCL).
          Transforms physical borehole logs, heavy machinery telemetric records, and monthly operational filings into cross-validated mathematical truth, verified DGMS compliance, and evidence-grounded parliamentary drafts.
        </p>

        {/* Dual Primary Call to Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 48,
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
              BM25 + 768-Dim Vector
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
              100% Grounded
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Zero Hallucination Gate
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

      {/* 4. CORE CAPABILITIES (8 Architectural Pillars) */}
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
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: '680px', margin: '8px auto 0' }}>
              Built from first principles to address real operational reporting bottlenecks across Coal India subsidiary commands.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 20,
            }}
          >
            {/* 1. Document Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(20, 184, 166, 0.14)', color: 'var(--accent-teal)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Document Intelligence & OCR</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-Format Parsing Engine</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Direct ingestion of PDF, scanned reports, DOCX, XLSX, and CSV records. Combines PyMuPDF layout parsing with Tesseract OCR fallback for scanned geological borehole maps and SHA-256 integrity checksums.
              </p>
              <div style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 600 }}>
                ✓ Table matrix extraction • Scanned text restoration • File fingerprinting
              </div>
            </div>

            {/* 2. Evidence-Grounded Retrieval / RAG */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.14)', color: 'var(--accent-primary)' }}>
                  <Search size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Evidence-Grounded RAG</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hybrid RRF Search</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Dual-tier retrieval fusing BM25 lexical keyword matching with dense vector semantic embeddings via Reciprocal Rank Fusion (RRF). Every retrieved chunk preserves exact document, page number, and bounding-box provenance.
              </p>
              <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>
                ✓ Reciprocal Rank Fusion • Sub-second search • Page-level evidence
              </div>
            </div>

            {/* 3. Mining Intelligence */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#60A5FA' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Mining Intelligence & KPIs</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Domain Extraction & Math</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Automated extraction of domain entities: Coal Production (MT), Overburden Removal (OBR in MCuM), Stripping Ratio, and Coal Gross Calorific Value classification across standard Indian G1 through G17 grades.
              </p>
              <div style={{ fontSize: 11, color: '#60A5FA', fontWeight: 600 }}>
                ✓ G1–G17 GCV categorization • Stripping ratio • Metric normalization
              </div>
            </div>

            {/* 4. Cross-Document Validation */}
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
                Automated mathematical cross-checking comparing monthly review reports, annual summaries, and production targets. Discrepancies exceeding variance thresholds are flagged with automated severity scoring.
              </p>
              <div style={{ fontSize: 11, color: 'var(--status-warning)', fontWeight: 600 }}>
                ✓ Automated variance calculation • Target vs actual • Conflict dispute logs
              </div>
            </div>

            {/* 5. Quality Governance */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.18)', color: 'var(--text-emerald)' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Quality Governance & Gates</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Zero-Hallucination Gatekeeper</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Deterministic quality audit gates that inspect AI synthesis prior to publication. Unverified assertions or ungrounded statistics trigger automatic REJECT decisions, requiring human officer review.
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-emerald)', fontWeight: 600 }}>
                ✓ Deterministic PASS/REJECT • Zero unverified facts • Officer sign-off
              </div>
            </div>

            {/* 6. Evidence Provenance */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.14)', color: '#A78BFA' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Evidence & Provenance</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cryptographic Audit Logs</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Complete traceability linking every generated paragraph and chart metric back to source documents, page numbers, and extraction bounding boxes with timestamped user attribution.
              </p>
              <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>
                ✓ Source document links • Page citations • Tamper-evident logs
              </div>
            </div>

            {/* 7. Report Generation */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(236, 72, 153, 0.14)', color: '#F472B6' }}>
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Statutory Report Generation</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Automated Synthesis</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Instant compilation of DGMS compliance documents, monthly subsidiary review briefs, and geological reserve summaries with integrated charts, table matrices, and executive summaries.
              </p>
              <div style={{ fontSize: 11, color: '#F472B6', fontWeight: 600 }}>
                ✓ DGMS compliance templates • Markdown & PDF export • Executive summaries
              </div>
            </div>

            {/* 8. Government Inquiry */}
            <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(249, 115, 22, 0.14)', color: '#FB923C' }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Parliamentary & Ministry Inquiries</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Evidence-Backed Answers</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Rapid response drafting for Parliament questions (Lok Sabha / Rajya Sabha) and Ministry notices. Ingests inquiry notices, locates citations, and constructs verified draft answers for Joint Secretary sign-off.
              </p>
              <div style={{ fontSize: 11, color: '#FB923C', fontWeight: 600 }}>
                ✓ Lok Sabha / Rajya Sabha drafts • Ministry QA • Mandatory officer review
              </div>
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700 }}>01. Orchestrator</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.18)', color: 'var(--text-emerald)', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ManagerAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Parses user objectives, creates task DAGs, routes sub-tasks, monitors bounded execution, and aggregates outputs.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              DAG_PLANNING • TASK_ROUTING
            </div>
          </div>

          {/* Agent 2 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--accent-teal)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-teal)', fontWeight: 700 }}>02. Ingestion</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(20, 184, 166, 0.18)', color: 'var(--accent-teal)', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>DocumentIntelligenceAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Handles PDF, DOCX, XLSX, and scanned image OCR via Tesseract, extracting structured tables and SHA-256 hashes.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              OCR • TABLE_PARSING • CHECKSUM
            </div>
          </div>

          {/* Agent 3 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #60A5FA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60A5FA', fontWeight: 700 }}>03. Retrieval</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#60A5FA', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>RetrievalAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Executes hybrid lexical BM25 and dense vector search fused via Reciprocal Rank Fusion (RRF) with exact page citations.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              BM25 • VECTOR_SEARCH • RRF_FUSION
            </div>
          </div>

          {/* Agent 4 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #A78BFA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#A78BFA', fontWeight: 700 }}>04. Mining Math</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(139, 92, 246, 0.18)', color: '#A78BFA', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>MiningIntelligenceAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Extracts domain-specific entities, standardizes units (MT/Lakh Te), computes stripping ratio, and categorizes GCV grades.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              GCV_CLASSIFICATION • OBR_MATH
            </div>
          </div>

          {/* Agent 5 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--status-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--status-warning)', fontWeight: 700 }}>05. Validation</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(245, 158, 11, 0.18)', color: 'var(--status-warning)', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ValidationAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Cross-checks numbers across multiple documents, detects mathematical discrepancies, and calculates variance severity.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              CROSS_DOC_AUDIT • VARIANCE_ENGINE
            </div>
          </div>

          {/* Agent 6 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #F472B6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F472B6', fontWeight: 700 }}>06. Synthesis</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(236, 72, 153, 0.18)', color: '#F472B6', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>ReportGenerationAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Synthesizes structured reports, executive summaries, DGMS compliance audits, and multi-format export files.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              DGMS_TEMPLATES • REPORT_BUILDER
            </div>
          </div>

          {/* Agent 7 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid #FB923C' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FB923C', fontWeight: 700 }}>07. Governance</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(249, 115, 22, 0.18)', color: '#FB923C', fontWeight: 700 }}>ACTIVE</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>GovernmentInquiryAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Analyzes Lok Sabha & Rajya Sabha parliamentary inquiries, generates citation-grounded drafts for officer approval.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              MINISTRY_QA • PARLIAMENT_DRAFTER
            </div>
          </div>

          {/* Agent 8 */}
          <div className="card-level-1" style={{ backgroundColor: 'var(--bg-surface-2)', padding: '20px', borderLeft: '4px solid var(--text-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-emerald)', fontWeight: 700 }}>08. Quality Gate</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.22)', color: 'var(--text-emerald)', fontWeight: 700 }}>GATEKEEPER</span>
            </div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>QualityGovernanceAgent</h5>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Enforces zero-hallucination release gates, checking citation grounding before issuing PASS, WARNING, or REJECT decisions.
            </p>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              RELEASE_GATE • ZERO_HALLUCINATION
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
                Modular blueprint architecture, SQLite3 transaction layer, SSE streaming, and sub-second endpoint response.
              </p>
            </div>

            <div style={{ padding: '22px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', marginBottom: 6 }}>SEARCH ENGINE</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Hybrid BM25 + Vector RRF</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Dense 768-dim embeddings with rank-fusion keyword fallback for exact mining terminology recall.
              </p>
            </div>

            <div style={{ padding: '22px', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', marginBottom: 6 }}>AI ENGINE</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Gemini Grounded / Ollama</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Pluggable LLM provider interface with deterministic zero-hallucination citation verification gates.
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
              Engineered specifically for Coal India hierarchical commands. Every document uploaded, query run, and report generated is cryptographically hashed with SHA-256 and tied to officer identity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Strict 4-Tier RBAC (Auditor, Analyst, Officer, Admin)',
                'Cryptographic SHA-256 document hashing & tamper detection',
                'Deterministic PASS / REJECT quality gate sign-off workflow',
                'Complete audit trail of all AI agent decisions and task graphs',
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
              Access Level Tiers
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
