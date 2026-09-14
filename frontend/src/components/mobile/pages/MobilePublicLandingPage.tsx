import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { MiningLogo } from '@/components/ui/MiningLogo';
import { MobileMineCart } from '@/components/mobile/MobileMineCart';

interface MobilePublicLandingPageProps {
  onExplorePlatform: () => void;
  onRegister: () => void;
  onLogin: () => void;
  onAuthorityAccess?: () => void;
}

const FLEET_SHOWCASE = [
  {
    name: 'Electric Walking Dragline (SAMRAT 2200W)',
    category: 'Heavy Overburden Stripping',
    capacity: '33 m³ Heavy Duty Bucket',
    image: '/images/dragline_excavator.jpg',
    desc: 'Primary overburden removal across multi-tier opencast coal benches with cycle time telemetry.',
  },
  {
    name: '240-Tonne Mega Haul Dump Truck',
    category: 'Heavy Pit Haulage',
    capacity: '240 MT Payload Capacity',
    image: '/images/haul_truck.jpg',
    desc: 'Matches weighbridge RFID tickets with subsidiary production reports to eliminate payload variances.',
  },
  {
    name: 'Opencast Multi-Bench Surface Mine',
    category: 'Pit Command & Benches',
    capacity: '92% of National Output',
    image: '/images/open_surface_mine.jpg',
    desc: 'Mathematical discrepancy engine cross-validates daily shovel logs and statutory filings.',
  },
];

export const MobilePublicLandingPage: React.FC<MobilePublicLandingPageProps> = ({
  onExplorePlatform,
  onRegister,
  onLogin,
  onAuthorityAccess,
}) => {
  return (
    <div className="mobile-app-root">
      {/* 1. Mobile Public Top Header */}
      <header className="mobile-topbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiningLogo size={24} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              GeoNexus
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onLogin}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-primary)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onRegister}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="mobile-main-viewport" style={{ paddingBottom: 'calc(var(--mobile-safe-bottom) + 32px)' }}>
        {/* 2. Hero Section */}
        <div
          className="mobile-card"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(7, 10, 15, 0.88), rgba(11, 16, 26, 0.98)), url("/images/open_surface_mine.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '24px 16px',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: 10,
              fontWeight: 800,
              margin: '0 auto',
            }}
          >
            <ShieldCheck size={12} /> MINISTRY OF COAL & COAL INDIA PLATFORM
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}>
            National Mining Intelligence & Discrepancy Engine
          </h1>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Automated multi-format document intelligence, borehole stratigraphy OCR, and mathematical cross-document variance detection.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-primary"
              onClick={onExplorePlatform}
            >
              Explore Operations Platform <ArrowRight size={15} />
            </button>

            {onAuthorityAccess && (
              <button
                type="button"
                className="mobile-btn-touch mobile-btn-outline"
                onClick={onAuthorityAccess}
                style={{ fontSize: 12 }}
              >
                <Lock size={13} /> Official Authority / Officer Access
              </button>
            )}
          </div>
        </div>

        {/* 3. SIGNATURE MOBILE MINE CART */}
        <MobileMineCart onSelectStageAction={() => onExplorePlatform()} />

        {/* 4. Core Value Metrics */}
        <div className="mobile-metrics-grid">
          <div className="mobile-metric-pill">
            <span className="mobile-metric-label">National Coverage</span>
            <span className="mobile-metric-value" style={{ color: '#10B981' }}>
              770+ MT
            </span>
            <span className="mobile-metric-sub">Annual CIL production audited</span>
          </div>

          <div className="mobile-metric-pill">
            <span className="mobile-metric-label">Discrepancy Gate</span>
            <span className="mobile-metric-value text-mono">±2.5%</span>
            <span className="mobile-metric-sub">Automated variance threshold</span>
          </div>

          <div className="mobile-metric-pill">
            <span className="mobile-metric-label">Multi-Agent System</span>
            <span className="mobile-metric-value" style={{ color: '#A78BFA' }}>
              8 Agents
            </span>
            <span className="mobile-metric-sub">Deterministic Manager-Worker</span>
          </div>

          <div className="mobile-metric-pill">
            <span className="mobile-metric-label">Quality Gate</span>
            <span className="mobile-metric-value" style={{ color: '#60A5FA' }}>
              ISO 25010
            </span>
            <span className="mobile-metric-sub">Zero-hallucination verification</span>
          </div>
        </div>

        {/* 5. Heavy Mining Fleet Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
            HEAVY MINING MACHINERY & TELEMETRY
          </div>

          {FLEET_SHOWCASE.map((f, i) => (
            <div key={i} className="mobile-card" style={{ padding: 0, overflow: 'hidden' }}>
              <img src={f.image} alt={f.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)' }}>
                    {f.category}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                    }}
                  >
                    {f.capacity}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 6. Footer CTA */}
        <div className="mobile-card" style={{ textAlign: 'center', padding: '20px 16px', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            Ready to Inspect Coal India Operations?
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
            Sign in with your role-authorized credentials or register a visitor account.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-primary"
              onClick={onRegister}
              style={{ flex: 1 }}
            >
              Get Started
            </button>
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-secondary"
              onClick={onLogin}
              style={{ flex: 1 }}
            >
              Sign In
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
